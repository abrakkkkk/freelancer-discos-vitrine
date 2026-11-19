// Preenche discos.faixas com a lista de faixas do Discogs.
//
// 1. Capa vinda do Discogs: o endereço da imagem traz o código do lançamento, então a lista é a dele.
// 2. Outras capas: busca por artista e título no Discogs, com a mesma conferência das capas.
// Só preenche disco com faixas vazias (null); nunca substitui o que já está gravado.
//
// Teste, só mostra e não grava:
//   node --env-file=.env.local scripts/preencher-faixas.mjs --loja "Loja 1" --caixas 49,50,51
// Grava no banco:
//   node --env-file=.env.local scripts/preencher-faixas.mjs --loja "Loja 1" --caixas 49,50,51 --gravar

import { createClient } from '@supabase/supabase-js';
import {
  discogsRefFromImageUrl,
  isVariousArtist,
  cleanTitle,
  parseDiscogsTitle,
  scoreCandidate,
} from '../src/utils/coverMatch.js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
const LOJA = valorArg('--loja');
const CAIXAS = (valorArg('--caixas') || '').split(',').map((c) => c.trim()).filter(Boolean);
const LIMITE = Number(valorArg('--limite')) || Infinity;
if (!LOJA || CAIXAS.length === 0) {
  console.error('Informe --loja "Loja 1" e --caixas 49,50,51.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey || !process.env.DISCOGS_KEY || !process.env.DISCOGS_SECRET) {
  console.error('Defina SUPABASE_URL, SUPABASE_SECRET_KEY, DISCOGS_KEY e DISCOGS_SECRET (use --env-file=.env.local).');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const HEADERS = {
  Authorization: `Discogs key=${process.env.DISCOGS_KEY}, secret=${process.env.DISCOGS_SECRET}`,
  'User-Agent': 'FreelancerDiscosVitrine/1.0',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hoje = new Date().toISOString().slice(0, 10);

// Respeita o limite do Discogs (60 consultas por minuto) e tenta de novo quando ele recusa.
async function discogs(url) {
  for (let tentativa = 1; tentativa <= 5; tentativa++) {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (res?.ok) {
      const restante = Number(res.headers.get('x-discogs-ratelimit-remaining'));
      if (Number.isFinite(restante) && restante < 5) await sleep(3000);
      return res.json();
    }
    if (res && res.status === 404) return null;
    await sleep(res?.status === 429 ? 30000 : 5000 * tentativa);
  }
  throw new Error(`Discogs não respondeu: ${url}`);
}

function faixasDe(dados) {
  // Faixas agrupadas (suíte, medley) vêm como "index" com as partes em sub_tracks.
  return (dados?.tracklist || [])
    .flatMap((f) => (f.type_ === 'index' && f.sub_tracks?.length ? f.sub_tracks : [f]))
    .filter((f) => (f.type_ || 'track') === 'track' && f.title)
    .map((f) => ({ posicao: f.position || '', titulo: f.title.trim(), duracao: f.duration || '' }));
}

async function porCapa(capaUrl) {
  const ref = discogsRefFromImageUrl(capaUrl);
  if (!ref) return null;
  const dados = await discogs(`https://api.discogs.com/${ref.tipo === 'master' ? 'masters' : 'releases'}/${ref.id}`);
  const faixas = faixasDe(dados);
  return faixas.length ? { faixas, fonte: `https://www.discogs.com/${ref.tipo}/${ref.id}`, origem: 'capa' } : null;
}

async function porBusca(item) {
  const artista = isVariousArtist(item.artista) ? 'Various' : item.artista;
  const titulo = cleanTitle(item.titulo).replace(/\s+/g, ' ').trim();
  const params = new URLSearchParams({ type: 'release', per_page: '15', artist: artista, release_title: titulo, format: 'Vinyl' });
  const busca = await discogs(`https://api.discogs.com/database/search?${params}`);

  let melhor = null;
  for (const r of busca?.results || []) {
    const cand = { ...parseDiscogsTitle(r.title), ano: r.year || '' };
    const nota = scoreCandidate(item, cand);
    if (!nota.aceito) continue;
    const score = nota.score + (r.country === 'Brazil' ? 0.02 : 0);
    if (!melhor || score > melhor.score) melhor = { id: r.id, score };
  }
  if (!melhor) return null;

  const dados = await discogs(`https://api.discogs.com/releases/${melhor.id}`);
  const faixas = faixasDe(dados);
  return faixas.length ? { faixas, fonte: `https://www.discogs.com/release/${melhor.id}`, origem: 'busca' } : null;
}

const { data: discos, error } = await supabase
  .from('discos')
  .select('id, artista, titulo, ano, caixa, capa_url')
  .eq('loja', LOJA)
  .in('caixa', CAIXAS)
  .eq('deletado', false)
  .is('faixas', null)
  .order('id');
if (error) {
  console.error('Erro ao ler os discos:', error.message);
  process.exit(1);
}

const fila = discos.slice(0, LIMITE);
console.log(`${fila.length} discos sem faixas em ${LOJA}, caixas ${CAIXAS.join(', ')}. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

const conta = { capa: 0, busca: 0, nada: 0, erro: 0 };
for (const [i, item] of fila.entries()) {
  let resultado = null;
  try {
    resultado = (await porCapa(item.capa_url)) || (await porBusca(item));
  } catch (err) {
    conta.erro++;
    console.log(`[${i + 1}/${fila.length}] ERRO ${item.artista} - ${item.titulo}: ${err.message}`);
    continue;
  }

  if (resultado) conta[resultado.origem]++;
  else conta.nada++;
  console.log(
    `[${i + 1}/${fila.length}] ${resultado ? `${resultado.faixas.length} faixas (${resultado.origem})` : 'não achou'}  ${item.artista} - ${item.titulo}`,
  );

  if (!GRAVAR) continue;
  const valor = resultado ? { faixas: resultado.faixas, fonte: resultado.fonte, em: hoje } : { faixas: [], em: hoje };
  const { error: erroGravar } = await supabase.from('discos').update({ faixas: valor }).eq('id', item.id).is('faixas', null);
  if (erroGravar) {
    console.error('Erro ao gravar:', erroGravar.message);
    process.exit(1);
  }
}

console.log(`Pela capa: ${conta.capa}. Pela busca: ${conta.busca}. Não achou: ${conta.nada}. Erros: ${conta.erro}.`);
