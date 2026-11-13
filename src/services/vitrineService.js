import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';

const COLUNAS = 'id, artista, titulo, preco, loja, caixa, ano, capa_url, observacao';
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

/** Prateleiras da página inicial: só discos com capa. Se uma falhar, ela vem vazia. */
export async function getVitrine() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  if (!supabaseServer) return { chegaram: [], destaques: [], importados: [], total: 0, hero: { destaque: null, capas: [] } };

  const [chegaram, destaques, importados, total, hero] = await Promise.all([
    // As caixas 50 e 51 da Loja 1 recebem os discos que acabaram de chegar.
    ativosComCapa().eq('loja', 'Loja 1').in('caixa', ['50', '51'])
      .order('criado_em', { ascending: false }).limit(POR_PRATELEIRA)
      .then(({ data, error }) => (error ? [] : data)),
    emDestaque().catch(() => []),
    ativosComCapa().ilike('observacao', '%importado%').order('criado_em', { ascending: false }).limit(POR_PRATELEIRA)
      .then(({ data, error }) => (error ? [] : data)),
    supabaseServer.from('discos').select('id', { count: 'exact', head: true })
      .eq('ativo', true).eq('deletado', false)
      .then(({ count, error }) => (error ? 0 : count || 0)),
    capasDoHero().catch(() => ({ destaque: null, capas: [] })),
  ]);

  // Contagem que falhou volta 0: usa a última boa e não guarda o resultado no cache.
  const totalBom = total || cache?.data.total || 0;
  const data = { chegaram, destaques, importados, total: totalBom, hero };
  if (total) cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
