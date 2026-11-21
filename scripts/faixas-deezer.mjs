// Terceira fonte para os LPs em dúvida: Deezer (sem chave). Lista da versão digital, sem lados.
// Só aceita o álbum se artista, título e selo baterem, e se ele couber num LP (até 16 faixas e
// 55 minutos, sem faixa bônus): reedição digital com bônus não é a lista do vinil.
//
//   node --env-file=.env.local scripts/faixas-deezer.mjs            (teste)
//   node --env-file=.env.local scripts/faixas-deezer.mjs --gravar

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { scoreCandidate, normalizeText } from '../src/utils/coverMatch.js';

const GRAVAR = process.argv.includes('--gravar');
const PASTA = path.resolve(process.cwd(), '.cache');
const RELATORIO = path.join(PASTA, GRAVAR ? 'faixas-deezer.jsonl' : 'faixas-deezer-teste.jsonl');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hoje = new Date().toISOString().slice(0, 10);

const ids = [...new Set(
  fs.readFileSync(path.join(PASTA, 'faixas-catalogo.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
    .filter((l) => l.resultado === 'duvida').map((l) => l.id),
)];

async function deezer(caminho) {
  await sleep(250);
  const res = await fetch(`https://api.deezer.com${caminho}`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  return res?.ok ? res.json() : null;
}

function seloDaObservacao(obs) {
  const m = String(obs || '').match(/\[([^\]]+)\]/);
  if (!m) return {};
  const partes = m[1].split('•').map((p) => p.trim());
  const ano = partes.find((p) => /^(19|20)\d{2}$/.test(p)) || '';
  return { selo: partes.find((p) => p && p !== ano) || '' };
}
const RUIDO = new Set(['records', 'record', 'discos', 'disco', 'music', 'musica', 'ltda', 'ltd', 'inc', 'brasil', 'brazil', 'do', 'de', 'the', 'entertainment', 'group']);
const tokens = (s) => normalizeText(s).split(' ').filter((t) => t.length > 1 && !RUIDO.has(t));
const mesmoSelo = (a, b) => {
  const ta = tokens(a);
  const tb = tokens(b);
  return ta.length > 0 && tb.length > 0 && (ta.every((t) => tb.includes(t)) || tb.every((t) => ta.includes(t)));
};
const BONUS = /\b(bonus|b[oô]nus|remix|demo|vers[aã]o alternativa|alternate|instrumental)\b/i;
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const { data: discos } = await supabase.from('discos').select('id, artista, titulo, ano, observacao').in('id', ids).is('faixas', null).eq('deletado', false);
console.log(`${discos.length} discos em dúvida. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

let achou = 0;
for (const d of discos) {
  const { selo } = seloDaObservacao(d.observacao);
  // Busca exata primeiro; sem resultado, texto livre (nome do artista escrito de outro jeito).
  // Disco com o nome do artista (homônimo): a conferência normal exige o ano, que no estoque
  // às vezes falta ou está errado. Aqui ele passa só se o artista tiver um único álbum homônimo.
  const homonimo = normalizeText(d.titulo) === normalizeText(d.artista);
  let candidatos = [];
  for (const q of [`artist:"${d.artista}" album:"${d.titulo}"`, `${d.artista} ${d.titulo}`]) {
    const busca = await deezer(`/search/album?q=${encodeURIComponent(q)}`);
    candidatos = (busca?.data || []).filter((a) => scoreCandidate({ ...d, ano: '1' }, { artista: a.artist?.name, titulo: a.title, ano: '1' }).aceito);
    if (candidatos.length) break;
  }
  // Artista com vários álbuns homônimos (Simone tem mais de um "Simone"): não dá para saber qual.
  if (homonimo && candidatos.length !== 1) candidatos = [];

  let ok = null;
  let motivo = candidatos.length ? '' : 'não achou no Deezer';
  for (const c of candidatos.slice(0, 5)) {
    const album = await deezer(`/album/${c.id}`);
    if (!album) continue;
    const faixas = album.tracks?.data || [];
    const minutos = faixas.reduce((s, f) => s + (f.duration || 0), 0) / 60;
    if (!mesmoSelo(selo, album.label || '')) { motivo = `Deezer: selo ${album.label}`; continue; }
    if (faixas.length < 6 || faixas.length > 16 || minutos > 55) { motivo = `Deezer: ${faixas.length} faixas, ${Math.round(minutos)} min (não parece o LP)`; continue; }
    if (faixas.some((f) => BONUS.test(f.title))) { motivo = 'Deezer: tem faixa bônus'; continue; }
    ok = {
      faixas: faixas.map((f, i) => ({ posicao: String(i + 1), titulo: f.title.trim(), duracao: f.duration ? mmss(f.duration) : '' })),
      fonte: album.link,
      achado: `${album.artist?.name} - ${album.title} (${album.release_date}, ${album.label})`,
    };
    break;
  }

  fs.appendFileSync(RELATORIO, JSON.stringify({ id: d.id, artista: d.artista, titulo: d.titulo, selo, resultado: ok ? 'ok' : 'duvida', motivo, achado: ok?.achado, fonte: ok?.fonte, faixas: ok?.faixas.length }) + '\n');
  console.log(ok ? `OK ${ok.faixas.length} faixas  ${d.artista} - ${d.titulo}  =>  ${ok.achado}` : `DÚVIDA (${motivo})  ${d.artista} - ${d.titulo}`);
  if (ok) {
    achou++;
    if (GRAVAR) await supabase.from('discos').update({ faixas: { faixas: ok.faixas, fonte: ok.fonte, em: hoje } }).eq('id', d.id).is('faixas', null);
  }
}
console.log(`Achou: ${achou} de ${discos.length}.`);
