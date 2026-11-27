import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';

const COLUNAS = 'id, artista, titulo, preco, loja, caixa, ano, capa_url, observacao, condicoes';
const POR_PRATELEIRA = 6;
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = null;

const ativosComCapa = () =>
  supabaseServer
    .from('discos')
    .select(COLUNAS)
    .eq('ativo', true)
    .eq('deletado', false)
    .not('capa_url', 'is', null);

// "Em destaque": discos das caixas 49, 50 e 51 escolhidos por fama e vendas (Last.fm, Spotify,
// Deezer e certificações, levantados em 2026-11-13). Os primeiros de cada fila são a escolha
// principal; se um sair do estoque, entra o próximo da mesma fila.
const DESTAQUES = {
  internacionais: [
    31007, // Bruno Mars, Doo-Wops & Hooligans
    30621, // Bob Marley & The Wailers, Legend
    31003, // Green Day, American Idiot
    31020, // Green Day, Dookie
    22701, // Taylor Swift, The Life of a Showgirl
  ],
  brasileiros: [
    20890, // Tribalistas, Tribalistas
    25127, // Marina Sena, Coisas Naturais
    30001, // Tim Maia, Tim Maia
    24668, // Djavan, Malásia
    31004, // Zeca Pagodinho, Deixa Clarear
  ],
};

// Alterna internacional e brasileiro, só com os que ainda estão no estoque.
async function emDestaque() {
  const ids = [...DESTAQUES.internacionais, ...DESTAQUES.brasileiros];
  const { data, error } = await ativosComCapa().in('id', ids);
  if (error) throw error;
  const emEstoque = new Map(data.map((d) => [d.id, d]));
  const filas = [DESTAQUES.internacionais, DESTAQUES.brasileiros].map((lista) =>
    lista.map((id) => emEstoque.get(id)).filter(Boolean),
  );
  const resultado = [];
  for (let i = 0; resultado.length < POR_PRATELEIRA && filas.some((f) => f.length); i++) {
    const fila = filas[i % 2].length ? filas[i % 2] : filas[(i + 1) % 2];
    resultado.push(fila.shift());
  }
  return resultado;
}

// Capas da abertura: o disco da Ana Frango Elétrico por cima e quatro capas das caixas 50 e 51.
// Se algum sair do estoque, entra o próximo da lista.
const HERO = {
  destaque: [22708, 20889, 26808], // Ana Frango Elétrico (Little Electric Chicken Heart; Me Chama De Gato...)
  capas: [31018, 28158, 31016, 25127, 30209, 30220, 31020], // Marvin Gaye, Chico Science, Kraftwerk, Marina Sena, Grace Jones, Tom Zé, Green Day
};

async function capasDoHero() {
  const { data, error } = await ativosComCapa().in('id', [...HERO.destaque, ...HERO.capas]);
  if (error) throw error;
  const emEstoque = new Map(data.map((d) => [d.id, d]));
  const destaque = HERO.destaque.map((id) => emEstoque.get(id)).find(Boolean) || null;
  const capas = HERO.capas.map((id) => emEstoque.get(id)).filter(Boolean).slice(0, 4);
  return { destaque, capas };
}

// Candidatos a mais por prateleira, para sobrar depois de tirar repetidos.
const CANDIDATOS = 40;

// Uma prateleira com no máximo um disco por artista e sem discos já mostrados acima
// (capas do hero e prateleiras anteriores).
function semRepetir(itens, usados) {
  const artistas = new Set();
  const resultado = [];
  for (const d of itens) {
    if (resultado.length >= POR_PRATELEIRA) break;
    const artista = String(d.artista || '').trim().toLowerCase();
    if (usados.has(d.id) || (artista && artistas.has(artista))) continue;
    if (artista) artistas.add(artista);
    resultado.push(d);
  }
  resultado.forEach((d) => usados.add(d.id));
  return resultado;
}

// As caixas 50 e 51 da Loja 1 recebem os discos que acabaram de chegar. Da caixa 49 entram só os
// prensados de 2018 em diante; os cadastrados antes de CORTE_49 ficam fora da página inicial.
const CORTE_49 = '2026-11-16T14:45:00';
const prensagemRecente = (d) => Number(d.ano) >= 2018;
const daCaixa49Valido = (d) => String(d.caixa) !== '49' || prensagemRecente(d);
const consultaChegaram = () =>
  ativosComCapa()
    .eq('loja', 'Loja 1')
    .or(`caixa.in.(50,51),and(caixa.eq.49,criado_em.gte.${CORTE_49})`)
    .order('criado_em', { ascending: false });
const consultaImportados = () =>
  ativosComCapa().ilike('observacao', '%importado%').order('criado_em', { ascending: false });

// Lista completa de uma prateleira, para a página dela. Erro do banco vai para error.js.
async function listaCompleta(consulta) {
  if (!supabaseServer) return [];
  const { data, error } = await consulta();
  if (error) throw new Error(`Erro ao buscar a lista: ${error.message}`);
  return (data || []).map((d) => ({ ...d, categoria: 'discos' }));
}

// Na página, depois dos que chegaram, os discos antigos da caixa 49 com prensagem recente.
const consultaCaixa49Antiga = () =>
  ativosComCapa().eq('loja', 'Loja 1').eq('caixa', '49').lt('criado_em', CORTE_49).order('criado_em', { ascending: false });

export async function getChegaramAgora() {
  const [novos, caixa49] = await Promise.all([listaCompleta(consultaChegaram), listaCompleta(consultaCaixa49Antiga)]);
  return [...novos.filter(daCaixa49Valido), ...caixa49.filter(prensagemRecente)];
}
export const getImportados = () => listaCompleta(consultaImportados);

/** Prateleiras da página inicial: só discos com capa. Se uma falhar, ela vem vazia. */
export async function getVitrine() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  if (!supabaseServer) return { chegaram: [], destaques: [], importados: [], total: 0, hero: { destaque: null, capas: [] } };

  const [chegaram, destaques, importados, total, hero] = await Promise.all([
    consultaChegaram().limit(CANDIDATOS).then(({ data, error }) => (error ? [] : data.filter(daCaixa49Valido))),
    emDestaque().catch(() => []),
    consultaImportados().limit(CANDIDATOS).then(({ data, error }) => (error ? [] : data)),
    supabaseServer.from('discos').select('id', { count: 'exact', head: true })
      .eq('ativo', true).eq('deletado', false)
      .then(({ count, error }) => (error ? 0 : count || 0)),
    capasDoHero().catch(() => ({ destaque: null, capas: [] })),
  ]);

  // Contagem que falhou volta 0: usa a última boa e não guarda o resultado no cache.
  const totalBom = total || cache?.data.total || 0;
  // A pilha do hero e "Em destaque" são escolhidas à mão (podem repetir disco entre si);
  // "Chegaram agora" e "Importados" não repetem nenhum deles.
  const usados = new Set([hero.destaque?.id, ...hero.capas.map((d) => d.id), ...destaques.map((d) => d.id)].filter(Boolean));
  const data = {
    chegaram: semRepetir(chegaram, usados),
    destaques,
    importados: semRepetir(importados, usados),
    total: totalBom,
    hero,
  };
  if (total) cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
