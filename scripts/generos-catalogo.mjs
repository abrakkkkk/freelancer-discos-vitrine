// Preenche os gêneros dos LPs (discos.generos e discos.genero_discogs) a partir do Discogs.
//
// 1. Procura no Discogs os discos ainda não procurados (genero_discogs null): pela fonte das faixas,
//    pela capa (conferindo artista e título) e, por último, pela busca. ~1 consulta por disco.
// 2. Traduz para os gêneros da loja (src/utils/generos.js), sem consultar o Discogs. Disco sem
//    "Latin" e sem faixas usa o artista para saber se é nacional; disco sem gênero herda o do
//    artista quando os outros discos dele concordam. Correções manuais em scripts/generos-correcoes.json.
// Pode ser interrompido e retomado: a etapa 1 só pega o que ainda não foi procurado.
//
//   node --env-file=.env.local scripts/generos-catalogo.mjs                 (teste, não grava)
//   node --env-file=.env.local scripts/generos-catalogo.mjs --gravar
//   --limite 300   --ids 1,2,3   --so-traduzir (pula a etapa 1)

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { headersDiscogs, buscarLancamentoParaGenero, generoParaGravar } from '../src/utils/faixasDiscogs.js';
import { generosDoDisco, ehGeneroValido } from '../src/utils/generos.js';
import { isVariousArtist, normalizeText } from '../src/utils/coverMatch.js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
const SO_TRADUZIR = args.includes('--so-traduzir');
const LIMITE = Number(valorArg('--limite')) || Infinity;
const IDS = (valorArg('--ids') || '').split(',').map(Number).filter(Boolean);

const headers = headersDiscogs();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
if (!headers || !process.env.SUPABASE_URL) {
  console.error('Use --env-file=.env.local (Supabase e Discogs).');
  process.exit(1);
}

const PASTA = path.resolve(process.cwd(), '.cache');
fs.mkdirSync(PASTA, { recursive: true });
const RELATORIO = path.join(PASTA, GRAVAR ? 'generos-sem-genero.jsonl' : 'generos-sem-genero-teste.jsonl');
const CORRECOES = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve('scripts/generos-correcoes.json'), 'utf8'));
  } catch {
    return {};
  }
})();

async function lerDiscos() {
  const todos = [];
  for (let de = 0; ; de += 1000) {
    let q = supabase
      .from('discos')
      .select('id, artista, titulo, ano, capa_url, faixas, generos, genero_discogs')
      .eq('deletado', false)
      .eq('ativo', true)
      .order('id')
      .range(de, de + 999);
    if (IDS.length) q = q.in('id', IDS);
    const { data, error } = await q;
    if (error) throw error;
    todos.push(...data);
    if (data.length < 1000) return todos;
  }
}

const discos = await lerDiscos();
console.log(`${discos.length} LPs ativos.`);

// Etapa 1: Discogs.
if (!SO_TRADUZIR) {
  const pendentes = discos.filter((d) => d.genero_discogs === null).slice(0, LIMITE);
  console.log(`Etapa 1: ${pendentes.length} discos para procurar no Discogs.`);
  let achados = 0;
  for (const [i, d] of pendentes.entries()) {
    try {
      const lancamento = await buscarLancamentoParaGenero(d, { headers });
      d.genero_discogs = generoParaGravar(lancamento);
      if (lancamento) achados++;
      if (GRAVAR) {
        // O gênero já vai para o site agora; a etapa 2 refina no fim (artista, correções).
        const generos = generosDoDisco(d.genero_discogs, (d.faixas?.faixas || []).map((f) => f.titulo));
        const atualizacao = { genero_discogs: d.genero_discogs };
        if (generos.length) atualizacao.generos = generos;
        const { error } = await supabase.from('discos').update(atualizacao).eq('id', d.id).is('genero_discogs', null);
        if (!error && generos.length) d.generos = generos;
        if (error) console.error(`Disco ${d.id}: erro ao gravar:`, error.message);
      }
    } catch (err) {
      console.error(`Disco ${d.id}: ${err.message}`);
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${pendentes.length} (${achados} achados)`);
  }
  console.log(`Etapa 1: ${achados} de ${pendentes.length} achados no Discogs.`);
}

// Etapa 2: tradução para os gêneros da loja.
const chaveArtista = (a) => (a && !isVariousArtist(a) ? normalizeText(a) : '');
const titulosDasFaixas = (d) => (d.faixas?.faixas || []).map((f) => f.titulo);

// Artista nacional: algum disco dele tem "Latin" ou faixas em português.
const nacionalPorArtista = new Map();
for (const d of discos) {
  const k = chaveArtista(d.artista);
  if (!k || !d.genero_discogs?.genres?.length) continue;
  const latino = d.genero_discogs.genres.includes('Latin');
  if (latino) nacionalPorArtista.set(k, true);
  else if (!nacionalPorArtista.has(k)) nacionalPorArtista.set(k, null);
}

const porArtistaManual = new Map(Object.entries(CORRECOES.artistas || {}).map(([a, g]) => [normalizeText(a), g]));
const validos = (lista) => (Array.isArray(lista) ? lista.filter(ehGeneroValido).slice(0, 1) : []);

// Gênero de cada disco antes do artista: correção manual do disco, senão o Discogs.
const calculados = new Map();
for (const d of discos) {
  const manual = validos(CORRECOES.ids?.[d.id]);
  calculados.set(
    d.id,
    manual.length
      ? { generos: manual, origem: 'manual' }
      : { generos: generosDoDisco(d.genero_discogs, titulosDasFaixas(d), nacionalPorArtista.get(chaveArtista(d.artista)) ?? null), origem: 'discogs' }
  );
}

// Um artista, um gênero: o mais comum entre os discos dele (com pelo menos 2 discos com gênero e
// sem empate). Assim os discos do mesmo artista não ficam espalhados. Coletâneas ficam disco a disco.
const votos = new Map();
for (const d of discos) {
  const k = chaveArtista(d.artista);
  const [genero] = calculados.get(d.id).generos;
  if (!k || !genero) continue;
  const v = votos.get(k) || new Map();
  v.set(genero, (v.get(genero) || 0) + 1);
  votos.set(k, v);
}
function generoDoArtista(artista) {
  const k = chaveArtista(artista);
  const manual = validos(porArtistaManual.get(k));
  if (manual.length) return manual[0];
  const v = votos.get(k);
  if (!v) return null;
  const ordem = [...v.entries()].sort((a, b) => b[1] - a[1]);
  const total = ordem.reduce((a, [, n]) => a + n, 0);
  if (total < 2 && ordem.length === 1) return ordem[0][0];
  if (total < 2 || (ordem[1] && ordem[1][1] === ordem[0][1])) return null;
  return ordem[0][0];
}

const iguais = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);
const relatorio = fs.createWriteStream(RELATORIO);
const resumo = { discogs: 0, artista: 0, manual: 0, semGenero: 0, mudou: 0 };
const contagem = {};

for (const d of discos) {
  let { generos, origem } = calculados.get(d.id);
  const doArtista = generoDoArtista(d.artista);
  if (doArtista && doArtista !== generos[0]) {
    generos = [doArtista];
    origem = 'artista';
  }

  if (generos.length) resumo[origem]++;
  else {
    resumo.semGenero++;
    relatorio.write(JSON.stringify({ id: d.id, artista: d.artista, titulo: d.titulo, discogs: d.genero_discogs }) + '\n');
  }
  generos.forEach((g) => (contagem[g] = (contagem[g] || 0) + 1));

  const valor = generos.length ? generos : null;
  if (iguais(valor, d.generos)) continue;
  resumo.mudou++;
  if (GRAVAR) {
    const { error } = await supabase.from('discos').update({ generos: valor }).eq('id', d.id);
    if (error) console.error(`Disco ${d.id}: erro ao gravar gêneros:`, error.message);
  }
}
relatorio.end();

console.log('Etapa 2:', resumo);
console.log('Por gênero:', Object.entries(contagem).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(', '));
console.log(`Discos sem gênero em ${RELATORIO}`);
if (!GRAVAR) console.log('Teste: nada foi gravado. Use --gravar.');
