// Segunda fonte para os LPs que o Discogs não resolveu: MusicBrainz (grátis, sem chave,
// 1 consulta por segundo). Mesma regra do faixas-catalogo.mjs: na dúvida não grava.
//
//   node --env-file=.env.local scripts/faixas-musicbrainz.mjs --ids 1,2,3            (teste)
//   node --env-file=.env.local scripts/faixas-musicbrainz.mjs --relatorio --gravar   (dúvidas do relatório do Discogs)

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { scoreCandidate, normalizeText } from '../src/utils/coverMatch.js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
const PASTA = path.resolve(process.cwd(), '.cache');
let ids = (valorArg('--ids') || '').split(',').map(Number).filter(Boolean);
if (args.includes('--relatorio')) {
  const linhas = fs.readFileSync(path.join(PASTA, 'faixas-catalogo.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  ids = [...new Set(linhas.filter((l) => l.resultado === 'duvida').map((l) => l.id))];
}
if (!ids.length) {
  console.error('Informe --ids ou --relatorio.');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const RELATORIO = path.join(PASTA, GRAVAR ? 'faixas-musicbrainz.jsonl' : 'faixas-musicbrainz-teste.jsonl');
const MB = 'https://musicbrainz.org/ws/2';
const HEADERS = { 'User-Agent': 'FreelancerDiscosVitrine/1.0 ( https://freelancerdiscos.com.br )', Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hoje = new Date().toISOString().slice(0, 10);

let ultima = 0;
async function mb(url) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const espera = 1100 - (Date.now() - ultima);
    if (espera > 0) await sleep(espera);
    ultima = Date.now();
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (res?.ok) return res.json();
    if (res?.status === 404) return null;
    await sleep(5000 * tentativa);
  }
  throw new Error('MusicBrainz não respondeu.');
}

function seloDaObservacao(obs) {
  const m = String(obs || '').match(/\[([^\]]+)\]/);
  if (!m) return {};
  const partes = m[1].split('•').map((p) => p.trim());
  const ano = partes.find((p) => /^(19|20)\d{2}$/.test(p)) || '';
  return { selo: partes.find((p) => p && p !== ano) || '', anoSelo: ano };
}
const RUIDO = new Set(['records', 'record', 'discos', 'disco', 'music', 'musica', 'ltda', 'ltd', 'inc', 'brasil', 'brazil', 'do', 'de', 'the']);
const tokens = (s) => normalizeText(s).split(' ').filter((t) => t && !RUIDO.has(t));
const mesmoSelo = (a, nomes) => {
  const ta = tokens(a);
  return ta.length > 0 && nomes.some((n) => {
    const tb = tokens(n);
    return tb.length && (ta.every((t) => tb.includes(t)) || tb.every((t) => ta.includes(t)));
  });
};
const aspas = (s) => `"${String(s).replace(/["\\]/g, ' ').trim()}"`;
const duracao = (ms) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}` : '');
const ehVinilGrande = (formato) => /vinyl/i.test(formato || '') && !/^(7|10)"/.test(formato || '');

async function buscar(item) {
  const query = `release:${aspas(item.titulo)} AND artist:${aspas(item.artista)}`;
  const busca = await mb(`${MB}/release/?fmt=json&limit=25&query=${encodeURIComponent(query)}`);
  const candidatos = (busca?.releases || [])
    .filter((r) => (r.media || []).some((m) => ehVinilGrande(m.format)))
    .filter((r) => {
      const artista = (r['artist-credit'] || []).map((a) => a.name + (a.joinphrase || '')).join('');
      return scoreCandidate(item, { artista, titulo: r.title, ano: (r.date || '').slice(0, 4) }).aceito;
    });
  if (!candidatos.length) return { motivo: 'não achou em vinil no MusicBrainz' };

  const ano = item.anoSelo || String(item.ano || '');
  const pontos = (r) =>
    (mesmoSelo(item.selo, (r['label-info'] || []).map((l) => l.label?.name || '')) ? 3 : 0) +
    (ano && (r.date || '').startsWith(ano) ? 2 : 0) +
    (r.country === 'BR' ? 0.5 : 0);
  candidatos.sort((a, b) => pontos(b) - pontos(a));
  const melhor = candidatos[0];

  const dados = await mb(`${MB}/release/${melhor.id}?fmt=json&inc=recordings+labels`);
  const midias = (dados?.media || []).filter((m) => ehVinilGrande(m.format));
  const faixas = midias.flatMap((m, i) =>
    (m.tracks || []).map((t) => {
      // Vinil costuma vir com "A1"; quando vem só o número, LP duplo vira "1-3".
      const pos = /^[A-Z]/i.test(t.number || '') ? t.number : midias.length > 1 ? `${i + 1}-${t.number || t.position}` : String(t.number || t.position);
      return { posicao: pos, titulo: String(t.title || '').trim(), duracao: duracao(t.length) };
    }),
  ).filter((f) => f.titulo);
  if (!faixas.length) return { motivo: 'edição do MusicBrainz sem faixas' };
  const selo = mesmoSelo(item.selo, (dados['label-info'] || []).map((l) => l.label?.name || ''));
  // Nomes curtos se repetem entre artistas de países diferentes (Simone x Simone de Oliveira):
  // aqui o selo do estoque é obrigatório.
  if (!selo) return { motivo: 'MusicBrainz: edição de outro selo', sugestao: `https://musicbrainz.org/release/${melhor.id}` };
  return { ok: { faixas, fonte: `https://musicbrainz.org/release/${melhor.id}`, selo } };
}

const { data: discos, error } = await supabase
  .from('discos')
  .select('id, artista, titulo, ano, observacao')
  .in('id', ids)
  .is('faixas', null)
  .eq('deletado', false);
if (error) throw error;
console.log(`${discos.length} discos. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

const conta = { ok: 0, duvida: 0, erro: 0 };
for (const [i, d] of discos.entries()) {
  const item = { ...d, ...seloDaObservacao(d.observacao) };
  let r;
  try {
    r = await buscar(item);
  } catch (err) {
    conta.erro++;
    console.log(`[${i + 1}/${discos.length}] ERRO ${item.artista} - ${item.titulo}: ${err.message}`);
    continue;
  }
  const linha = { id: d.id, artista: d.artista, titulo: d.titulo, selo: item.selo };
  if (r.ok) {
    conta.ok++;
    fs.appendFileSync(RELATORIO, JSON.stringify({ ...linha, resultado: 'ok', faixas: r.ok.faixas.length, fonte: r.ok.fonte, mesmoSelo: r.ok.selo }) + '\n');
    console.log(`[${i + 1}/${discos.length}] ${r.ok.faixas.length} faixas${r.ok.selo ? '' : ' (selo diferente)'}  ${d.artista} - ${d.titulo}`);
    if (GRAVAR) {
      const { error: e } = await supabase.from('discos').update({ faixas: { faixas: r.ok.faixas, fonte: r.ok.fonte, em: hoje } }).eq('id', d.id).is('faixas', null);
      if (e) throw e;
    }
  } else {
    conta.duvida++;
    fs.appendFileSync(RELATORIO, JSON.stringify({ ...linha, resultado: 'duvida', motivo: r.motivo, sugestao: r.sugestao || null }) + '\n');
    console.log(`[${i + 1}/${discos.length}] DÚVIDA (${r.motivo})  ${d.artista} - ${d.titulo}`);
  }
}
console.log(`Achou: ${conta.ok}. Dúvida: ${conta.duvida}. Erros: ${conta.erro}. Relatório: ${RELATORIO}`);
