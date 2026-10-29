// Audita as capas já gravadas em capa_url (discos e cds) e gera um CSV para revisão.
//
// Auditoria (somente leitura, pode ser interrompida e retomada):
//   node --env-file=.env.local scripts/auditar-capas.mjs [--limite 50]
//
// Limpeza (depois de revisar o CSV; só zera capa_url das linhas com veredito "reprovada"):
//   node --env-file=.env.local scripts/auditar-capas.mjs --aplicar .cache/auditoria-capas.csv            (simulação)
//   node --env-file=.env.local scripts/auditar-capas.mjs --aplicar .cache/auditoria-capas.csv --confirmar (grava)

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  scoreCandidate,
  discogsRefFromImageUrl,
  limparNomeArtistaDiscogs,
} from '../src/utils/coverMatch.js';

const TABELAS = ['discos', 'cds'];
const PASTA = path.resolve(process.cwd(), '.cache');
const PROGRESSO = path.join(PASTA, 'auditoria-capas-progresso.json');
const CSV_SAIDA = path.join(PASTA, 'auditoria-capas.csv');

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Defina SUPABASE_URL e SUPABASE_SECRET_KEY (use --env-file=.env.local).');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const DISCOGS_KEY = process.env.DISCOGS_KEY;
const DISCOGS_SECRET = process.env.DISCOGS_SECRET;
// Limites do Discogs: 60 req/min autenticado, 25 req/min sem chave.
const DISCOGS_INTERVALO_MS = DISCOGS_KEY && DISCOGS_SECRET ? 1100 : 2500;
const ITUNES_INTERVALO_MS = 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function csvCampo(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function lerCsv(texto) {
  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  const [cabecalho, ...dados] = linhas.filter((l) => l.some((c) => c !== ''));
  const cab = cabecalho.map((c) => c.replace(/^﻿/, ''));
  return dados.map((l) => Object.fromEntries(cab.map((c, i) => [c, l[i] ?? ''])));
}

async function carregarItensComCapa() {
  const itens = [];
  for (const tabela of TABELAS) {
    for (let inicio = 0; ; inicio += 1000) {
      const { data, error } = await supabase
        .from(tabela)
        .select('id, artista, titulo, ano, capa_url, ativo, deletado')
        .not('capa_url', 'is', null)
        .order('id')
        .range(inicio, inicio + 999);
      if (error) throw new Error(`Erro ao ler ${tabela}: ${error.message}`);
      itens.push(...data.map((d) => ({ ...d, tabela })));
      if (data.length < 1000) break;
    }
  }
  return itens;
}

let ultimoDiscogs = 0;
async function buscarDiscogsRef(ref) {
  const espera = ultimoDiscogs + DISCOGS_INTERVALO_MS - Date.now();
  if (espera > 0) await sleep(espera);
  ultimoDiscogs = Date.now();

  const headers = { 'User-Agent': 'FreelancerDiscosVitrine/1.0 auditoria' };
  if (DISCOGS_KEY && DISCOGS_SECRET) headers.Authorization = `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`;
  const url = `https://api.discogs.com/${ref.tipo === 'master' ? 'masters' : 'releases'}/${ref.id}`;

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (res?.status === 429) {
      await sleep(60000);
      continue;
    }
    if (!res?.ok) return { erro: `discogs_http_${res?.status ?? 'falha'}` };
    const j = await res.json();
    return {
      artista: (j.artists || []).map((a) => limparNomeArtistaDiscogs(a.name)).join(' / '),
      titulo: j.title || '',
      ano: j.year || '',
      descricao: `${(j.formats || []).map((f) => f.name).join('/')} ${j.country || ''}`.trim(),
    };
  }
  return { erro: 'discogs_rate_limit' };
}

const baseArtwork = (u) => String(u || '').replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, '');

let ultimoItunes = 0;
async function identificarItunes(item) {
  const espera = ultimoItunes + ITUNES_INTERVALO_MS - Date.now();
  if (espera > 0) await sleep(espera);
  ultimoItunes = Date.now();

  // Refaz a mesma busca do algoritmo antigo para descobrir de qual álbum veio a arte.
  const termo = `${item.artista || ''} ${item.titulo || ''}`
    .replace(/\b(v[aá]rios(\s+artistas)?|various)\b/gi, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();
  const params = new URLSearchParams({ term: termo, country: 'BR', media: 'music', entity: 'album', limit: '25' });
  const res = await fetch(`https://itunes.apple.com/search?${params}`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!res?.ok) return { erro: `itunes_http_${res?.status ?? 'falha'}` };
  const j = await res.json();
  const alvo = baseArtwork(item.capa_url);
  const hit = (j.results || []).find((r) => baseArtwork(r.artworkUrl100) === alvo);
  if (!hit) return { erro: 'itunes_album_nao_identificado' };
  return {
    artista: hit.artistName || '',
    titulo: hit.collectionName || '',
    ano: (hit.releaseDate || '').slice(0, 4),
    descricao: 'iTunes',
  };
}

async function auditar() {
  fs.mkdirSync(PASTA, { recursive: true });
  const progresso = fs.existsSync(PROGRESSO) ? JSON.parse(fs.readFileSync(PROGRESSO, 'utf-8')) : {};
  const refsDiscogs = new Map();

  let itens = await carregarItensComCapa();
  const limite = Number(valorArg('--limite'));
  if (limite > 0) itens = itens.slice(0, limite);
  console.log(`${itens.length} itens com capa. Discogs ${DISCOGS_KEY ? 'autenticado' : 'sem chave (mais lento)'}.`);

  let salvarEm = Date.now();
  for (const [i, item] of itens.entries()) {
    const chave = `${item.tabela}:${item.id}:${item.capa_url}`;
    if (progresso[chave]) continue;

    let capaDe;
    const ref = discogsRefFromImageUrl(item.capa_url);
    if (ref) {
      const k = `${ref.tipo}:${ref.id}`;
      if (!refsDiscogs.has(k)) refsDiscogs.set(k, await buscarDiscogsRef(ref));
      capaDe = { ...refsDiscogs.get(k), ref: `${ref.tipo === 'master' ? 'M' : 'R'}-${ref.id}` };
    } else if (/mzstatic\.com/i.test(item.capa_url)) {
      capaDe = await identificarItunes(item);
    } else {
      capaDe = { erro: 'origem_desconhecida' };
    }

    let veredito = 'indeterminada';
    let motivo = capaDe.erro || '';
    let score = '';
    if (!capaDe.erro) {
      const r = scoreCandidate(
        { artista: item.artista, titulo: item.titulo, ano: item.ano },
        { artista: capaDe.artista, titulo: capaDe.titulo, ano: capaDe.ano }
      );
      veredito = r.aceito ? 'aprovada' : 'reprovada';
      motivo = r.motivo;
      score = r.aceito ? r.score : '';
    }

    progresso[chave] = {
      veredito,
      motivo,
      score,
      capa_de: capaDe.erro ? '' : `${capaDe.artista} - ${capaDe.titulo} (${capaDe.ano || 's/ ano'}${capaDe.descricao ? `, ${capaDe.descricao}` : ''})${capaDe.ref ? ` ${capaDe.ref}` : ''}`,
    };

    if (Date.now() - salvarEm > 15000) {
      fs.writeFileSync(PROGRESSO, JSON.stringify(progresso));
      salvarEm = Date.now();
      console.log(`${i + 1}/${itens.length}`);
    }
  }
  fs.writeFileSync(PROGRESSO, JSON.stringify(progresso));

  const ordem = { reprovada: 0, indeterminada: 1, aprovada: 2 };
  const linhas = itens
    .map((item) => ({ item, r: progresso[`${item.tabela}:${item.id}:${item.capa_url}`] }))
    .sort((a, b) => ordem[a.r.veredito] - ordem[b.r.veredito] || a.item.id - b.item.id);

  const cabecalho = ['veredito', 'motivo', 'tabela', 'id', 'ativo', 'artista', 'titulo', 'ano', 'capa_de', 'score', 'capa_url'];
  const corpo = linhas.map(({ item, r }) =>
    [r.veredito, r.motivo, item.tabela, item.id, item.ativo && !item.deletado, item.artista, item.titulo, item.ano, r.capa_de, r.score, item.capa_url]
      .map(csvCampo)
      .join(',')
  );
  fs.writeFileSync(CSV_SAIDA, '﻿' + [cabecalho.join(','), ...corpo].join('\r\n'), 'utf-8');

  const contagem = linhas.reduce((acc, { r }) => ({ ...acc, [r.veredito]: (acc[r.veredito] || 0) + 1 }), {});
  console.log('Resultado:', contagem);
  console.log(`CSV: ${CSV_SAIDA}`);
}

async function aplicar(arquivo) {
  const confirmar = args.includes('--confirmar');
  const linhas = lerCsv(fs.readFileSync(arquivo, 'utf-8')).filter((l) => l.veredito === 'reprovada');
  console.log(`${linhas.length} capas reprovadas no CSV.${confirmar ? '' : ' SIMULAÇÃO: nada será gravado (use --confirmar).'}`);

  let zeradas = 0;
  for (const l of linhas) {
    if (!TABELAS.includes(l.tabela) || !/^\d+$/.test(l.id) || !l.capa_url) {
      console.warn('Linha ignorada (dados inválidos):', l.tabela, l.id);
      continue;
    }
    if (!confirmar) {
      console.log(`[simulação] ${l.tabela} #${l.id} ${l.artista} - ${l.titulo}: capa_url seria apagada`);
      continue;
    }
    // Só apaga se a capa ainda for a mesma que foi auditada.
    const { data, error } = await supabase
      .from(l.tabela)
      .update({ capa_url: null })
      .eq('id', Number(l.id))
      .eq('capa_url', l.capa_url)
      .select('id');
    if (error) console.error(`Erro em ${l.tabela} #${l.id}:`, error.message);
    else zeradas += data.length;
  }
  if (confirmar) console.log(`${zeradas} capas apagadas.`);
}

const arquivoAplicar = valorArg('--aplicar');
(arquivoAplicar ? aplicar(arquivoAplicar) : auditar()).catch((err) => {
  console.error(err);
  process.exit(1);
});
