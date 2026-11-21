// Preenche as faixas dos LPs bem cadastrados (artista, título e selo na observação) com
// conferência rigorosa. Na dúvida não grava: o disco entra no relatório com o motivo.
//
// 1. Capa do Discogs: usa a edição da capa se for vinil e se artista e título baterem.
// 2. Capa em CD, de outra mídia, ou sem capa: procura a edição em vinil, preferindo o selo
//    e o ano do estoque.
// Só grava em disco com faixas vazias (null). Pode ser interrompido e retomado.
//
//   node --env-file=.env.local scripts/faixas-catalogo.mjs            (teste, não grava)
//   node --env-file=.env.local scripts/faixas-catalogo.mjs --gravar
//   --limite 50   --ids 1,2,3

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { discogsRefFromImageUrl, isVariousArtist, cleanTitle, parseDiscogsTitle, scoreCandidate, limparNomeArtistaDiscogs, normalizeText } from '../src/utils/coverMatch.js';
import { consultar, faixasDoLancamento, headersDiscogs } from '../src/utils/faixasDiscogs.js';

const args = process.argv.slice(2);
const valorArg = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const GRAVAR = args.includes('--gravar');
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
const RELATORIO = path.join(PASTA, GRAVAR ? 'faixas-catalogo.jsonl' : 'faixas-catalogo-teste.jsonl');
const API = 'https://api.discogs.com';
const hoje = new Date().toISOString().slice(0, 10);

// "[RCA Victor • 1977] Importado" -> { selo: 'RCA Victor', ano: '1977' }
function seloDaObservacao(obs) {
  const m = String(obs || '').match(/\[([^\]]+)\]/);
  if (!m) return null;
  const partes = m[1].split('•').map((p) => p.trim());
  const ano = partes.find((p) => /^(19|20)\d{2}$/.test(p)) || '';
  const selo = partes.find((p) => p && p !== ano) || '';
  return selo ? { selo, anoSelo: ano } : null;
}

const RUIDO_SELO = new Set(['records', 'record', 'discos', 'disco', 'music', 'musica', 'gravadora', 'ltda', 'ltd', 'inc', 'brasil', 'brazil', 'do', 'de', 'the']);
const tokensSelo = (s) => normalizeText(s).split(' ').filter((t) => t && !RUIDO_SELO.has(t));
function mesmoSelo(seloEstoque, labels = []) {
  const a = tokensSelo(seloEstoque);
  if (!a.length) return false;
  return labels.some((l) => {
    const b = tokensSelo(l.name || l);
    return b.length && (a.every((t) => b.includes(t)) || b.every((t) => a.includes(t)));
  });
}

// No estoque só há vinil grande (LP e 12"); edição de 7" (compacto) é de outro disco.
const ehVinil = (dados) =>
  (dados?.formats || []).some((f) => /vinyl/i.test(f.name) && !(f.descriptions || []).some((d) => /^(7|10)"$/.test(d)));
const artistaDoLancamento = (dados) =>
  limparNomeArtistaDiscogs((dados?.artists || []).map((a) => a.name).join(' & ') || dados?.artists_sort || '');

function confere(item, dados) {
  return scoreCandidate(item, { artista: artistaDoLancamento(dados), titulo: dados?.title || '', ano: dados?.year || '' });
}

async function pelaCapa(item) {
  const ref = discogsRefFromImageUrl(item.capa_url);
  if (!ref || ref.tipo !== 'release') return { motivo: ref ? 'capa é de um master' : 'sem capa do Discogs' };
  const dados = await consultar(`${API}/releases/${ref.id}`, headers);
  if (!dados) return { motivo: 'edição da capa não existe mais' };
  const nota = confere(item, dados);
  if (!nota.aceito) return { motivo: `capa não confere (${nota.motivo})`, capaErrada: true };
  if (!ehVinil(dados)) return { motivo: 'capa é de outra mídia', dados };
  const faixas = faixasDoLancamento(dados);
  if (!faixas.length) return { motivo: 'edição da capa sem faixas' };
  const selo = mesmoSelo(item.selo, dados.labels);
  // Compacto (12", EP) é comum; com poucas faixas e selo diferente, pode ser a edição errada.
  if (faixas.length <= 3 && !selo) return { motivo: `capa leva a edição de ${faixas.length} faixas de outro selo` };
  return { ok: { faixas, fonte: `https://www.discogs.com/release/${ref.id}`, origem: 'capa', selo } };
}

async function pelaBusca(item) {
  const artista = isVariousArtist(item.artista) ? 'Various' : item.artista;
  const titulo = cleanTitle(item.titulo).replace(/\s+/g, ' ').trim();
  const base = { type: 'release', per_page: '25', artist: artista, release_title: titulo, format: 'Vinyl' };

  // Primeiro com o selo do estoque; sem resultado, sem o selo.
  let resultados = [];
  for (const extra of [{ label: item.selo }, {}]) {
    const busca = await consultar(`${API}/database/search?${new URLSearchParams({ ...base, ...extra })}`, headers);
    resultados = (busca?.results || []).filter((r) => scoreCandidate(item, { ...parseDiscogsTitle(r.title), ano: r.year || '' }).aceito);
    if (resultados.length) break;
  }
  if (!resultados.length) return { motivo: 'não achou em vinil no Discogs' };

  const pontos = (r) => {
    const formato = (r.format || []).join(' ');
    let p = 0;
    if (mesmoSelo(item.selo, r.label || [])) p += 3;
    const ano = item.anoSelo || String(item.ano || '');
    if (ano && String(r.year) === ano) p += 2;
    if (/\b(LP|Album)\b/.test(formato)) p += 1;
    if (/\b(7|10)"/.test(formato)) p -= 10;
    else if (/Single|\bEP\b|Promo/.test(formato)) p -= 3;
    if (r.country === 'Brazil') p += 0.5;
    return p;
  };
  resultados.sort((a, b) => pontos(b) - pontos(a));
  const melhor = resultados[0];

  const dados = await consultar(`${API}/releases/${melhor.id}`, headers);
  if (!ehVinil(dados)) return { motivo: 'só achou compacto de 7"', sugestao: `https://www.discogs.com/release/${melhor.id}` };
  const faixas = faixasDoLancamento(dados);
  if (!faixas.length) return { motivo: 'edição achada sem faixas' };
  if (!confere(item, dados).aceito) return { motivo: 'edição achada não confere' };
  const selo = mesmoSelo(item.selo, dados.labels);
  // Maxi-single de 12" com o selo do estoque é o disco; com outro selo, pode ser outra edição.
  if (faixas.length <= 3 && !selo) {
    return { motivo: `edição achada tem só ${faixas.length} faixas e outro selo`, sugestao: `https://www.discogs.com/release/${melhor.id}` };
  }
  return { ok: { faixas, fonte: `https://www.discogs.com/release/${melhor.id}`, origem: 'busca', selo } };
}

async function lerDiscos() {
  const todos = [];
  for (let de = 0; ; de += 1000) {
    let q = supabase.from('discos').select('id, artista, titulo, ano, observacao, capa_url, loja, caixa').eq('deletado', false).eq('ativo', true).is('faixas', null);
    if (IDS.length) q = q.in('id', IDS);
    const { data, error } = await q.order('id').range(de, de + 999);
    if (error) throw error;
    todos.push(...data);
    if (data.length < 1000) break;
  }
  return todos
    .map((d) => ({ ...d, ...(seloDaObservacao(d.observacao) || {}) }))
    .filter((d) => d.selo && d.artista && d.titulo);
}

const fila = (await lerDiscos()).slice(0, LIMITE);
console.log(`${fila.length} LPs bem cadastrados sem faixas. ${GRAVAR ? 'Gravando.' : 'Teste, sem gravar.'}`);

const conta = { capa: 0, busca: 0, duvida: 0, erro: 0 };
for (const [i, item] of fila.entries()) {
  let r;
  try {
    r = await pelaCapa(item);
    if (!r.ok) {
      const motivoCapa = r.motivo;
      const b = await pelaBusca(item);
      r = b.ok ? b : { ...b, motivo: `${motivoCapa}; ${b.motivo}` };
    }
  } catch (err) {
    conta.erro++;
    console.log(`[${i + 1}/${fila.length}] ERRO ${item.artista} - ${item.titulo}: ${err.message}`);
    continue;
  }

  const linha = { id: item.id, artista: item.artista, titulo: item.titulo, selo: item.selo, ano: item.ano, loja: item.loja, caixa: item.caixa };
  if (r.ok) {
    conta[r.ok.origem]++;
    fs.appendFileSync(RELATORIO, JSON.stringify({ ...linha, resultado: 'ok', origem: r.ok.origem, faixas: r.ok.faixas.length, fonte: r.ok.fonte, mesmoSelo: r.ok.selo }) + '\n');
    console.log(`[${i + 1}/${fila.length}] ${r.ok.faixas.length} faixas (${r.ok.origem}${r.ok.selo ? '' : ', selo diferente'})  ${item.artista} - ${item.titulo}`);
    if (GRAVAR) {
      const valor = { faixas: r.ok.faixas, fonte: r.ok.fonte, em: hoje };
      const { error } = await supabase.from('discos').update({ faixas: valor }).eq('id', item.id).is('faixas', null);
      if (error) throw error;
    }
  } else {
    conta.duvida++;
    fs.appendFileSync(RELATORIO, JSON.stringify({ ...linha, resultado: 'duvida', motivo: r.motivo, sugestao: r.sugestao || null }) + '\n');
    console.log(`[${i + 1}/${fila.length}] DÚVIDA (${r.motivo})  ${item.artista} - ${item.titulo}`);
  }
}

console.log(`Pela capa: ${conta.capa}. Pela busca: ${conta.busca}. Dúvida: ${conta.duvida}. Erros: ${conta.erro}. Relatório: ${RELATORIO}`);
