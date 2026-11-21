// Segunda passada no Discogs para os LPs que ficaram em dúvida no faixas-catalogo.mjs.
// O nome do artista pode estar escrito de outro jeito ("Dominguinhos E Sua Sanfona" x
// "Dominguinhos"), então ele só precisa ter uma palavra em comum; em troca, exige que
// título, selo e ano (quando há) batam ao mesmo tempo. Na dúvida, não grava.
//
//   node --env-file=.env.local scripts/faixas-duvidas.mjs            (teste)
//   node --env-file=.env.local scripts/faixas-duvidas.mjs --gravar

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { cleanTitle, parseDiscogsTitle, scoreCandidate, normalizeText, isVariousArtist } from '../src/utils/coverMatch.js';
import { consultar, faixasDoLancamento, headersDiscogs } from '../src/utils/faixasDiscogs.js';

const GRAVAR = process.argv.includes('--gravar');
const headers = headersDiscogs();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const PASTA = path.resolve(process.cwd(), '.cache');
const RELATORIO = path.join(PASTA, GRAVAR ? 'faixas-duvidas.jsonl' : 'faixas-duvidas-teste.jsonl');
const hoje = new Date().toISOString().slice(0, 10);

const linhas = fs.readFileSync(path.join(PASTA, 'faixas-catalogo.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const ids = [...new Set(linhas.filter((l) => l.resultado === 'duvida').map((l) => l.id))];

const RUIDO = new Set(['records', 'record', 'discos', 'disco', 'music', 'musica', 'ltda', 'ltd', 'inc', 'brasil', 'brazil', 'do', 'de', 'da', 'the', 'e', 'and', 'sua', 'seu', 'orquestra', 'conjunto', 'ritmo', 'sanfona', 'grupo', 'trio']);
const tokens = (s) => normalizeText(s).split(' ').filter((t) => t.length > 1 && !RUIDO.has(t));
const mesmoSelo = (a, nomes) => {
  const ta = tokens(a);
  return ta.length > 0 && nomes.some((n) => {
    const tb = tokens(n);
    return tb.length && (ta.every((t) => tb.includes(t)) || tb.every((t) => ta.includes(t)));
  });
};
const artistaParecido = (a, b) => {
  if (isVariousArtist(a) || isVariousArtist(b)) return isVariousArtist(a) && isVariousArtist(b);
  const tb = tokens(b);
  return tokens(a).some((t) => tb.includes(t));
};
const vinilGrande = (formatos) => formatos.some((f) => /vinyl/i.test(f.name) && !(f.descriptions || []).some((d) => /^(7|10)"$/.test(d)));

function seloDaObservacao(obs) {
  const m = String(obs || '').match(/\[([^\]]+)\]/);
  if (!m) return {};
  const partes = m[1].split('•').map((p) => p.trim());
  const ano = partes.find((p) => /^(19|20)\d{2}$/.test(p)) || '';
  return { selo: partes.find((p) => p && p !== ano) || '', anoSelo: ano };
}

const { data: discos } = await supabase.from('discos').select('id, artista, titulo, ano, observacao').in('id', ids).is('faixas', null);
console.log(`${discos.length} discos em dúvida. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

let achou = 0;
for (const d of discos) {
  const item = { ...d, ...seloDaObservacao(d.observacao) };
  const ano = item.anoSelo || (/^(19|20)\d{2}$/.test(String(d.ano)) ? String(d.ano) : '');
  const titulo = cleanTitle(d.titulo).replace(/\s+/g, ' ').trim();
  const busca = await consultar(
    `https://api.discogs.com/database/search?${new URLSearchParams({ type: 'release', per_page: '50', release_title: titulo, label: item.selo, format: 'Vinyl' })}`,
    headers,
  );
  const candidatos = (busca?.results || []).filter((r) => {
    const c = { ...parseDiscogsTitle(r.title), ano: r.year || '' };
    // Título conferido como se o artista fosse o mesmo; o artista só precisa ser parecido.
    return (
      artistaParecido(d.artista, c.artista) &&
      scoreCandidate({ ...d, artista: c.artista }, c).aceito &&
      mesmoSelo(item.selo, r.label || []) &&
      (!ano || !r.year || String(r.year) === ano) &&
      !(r.format || []).some((f) => /^(7|10)"$/.test(f))
    );
  });

  let resultado = null;
  let motivo = candidatos.length ? '' : 'nenhuma edição com o mesmo título, selo e ano';
  if (candidatos.length) {
    candidatos.sort((a, b) => (String(b.year) === ano) - (String(a.year) === ano) || (b.country === 'Brazil') - (a.country === 'Brazil'));
    const dados = await consultar(`https://api.discogs.com/releases/${candidatos[0].id}`, headers);
    const faixas = faixasDoLancamento(dados);
    if (!vinilGrande(dados?.formats || [])) motivo = 'edição achada não é LP';
    else if (faixas.length < 4) motivo = `edição achada tem só ${faixas.length} faixas`;
    else resultado = { faixas, fonte: `https://www.discogs.com/release/${candidatos[0].id}`, achado: `${dados.artists_sort} - ${dados.title} (${dados.year}, ${(dados.labels || []).map((l) => l.name).join('/')})` };
  }

  fs.appendFileSync(RELATORIO, JSON.stringify({ id: d.id, artista: d.artista, titulo: d.titulo, selo: item.selo, ano, resultado: resultado ? 'ok' : 'duvida', motivo, achado: resultado?.achado, fonte: resultado?.fonte, faixas: resultado?.faixas.length }) + '\n');
  console.log(resultado ? `OK ${resultado.faixas.length} faixas  ${d.artista} - ${d.titulo}  =>  ${resultado.achado}` : `DÚVIDA (${motivo})  ${d.artista} - ${d.titulo}`);
  if (resultado) {
    achou++;
    if (GRAVAR) await supabase.from('discos').update({ faixas: { faixas: resultado.faixas, fonte: resultado.fonte, em: hoje } }).eq('id', d.id).is('faixas', null);
  }
}
console.log(`Achou: ${achou} de ${discos.length}.`);
