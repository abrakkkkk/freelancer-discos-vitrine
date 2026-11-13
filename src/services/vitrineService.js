import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';
import ranking from '@/data/destaques-lojas.json';

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

// Os discos mais famosos do ranking que ainda estão no estoque, alternando as lojas.
async function maisProcurados() {
  const porLoja = Object.values(ranking?.lojas || {}).map((artistas) =>
    artistas.flatMap((a) => a.ids),
  );
  const ids = porLoja.flat();
  if (ids.length === 0) return [];

  const { data, error } = await ativosComCapa().in('id', ids);
  if (error) throw error;
  const emEstoque = new Map(data.map((d) => [d.id, d]));

  const filas = porLoja.map((lista) => lista.map((id) => emEstoque.get(id)).filter(Boolean));
  const vistos = new Set();
  const resultado = [];
  for (let i = 0; resultado.length < POR_PRATELEIRA && filas.some((f) => f.length); i++) {
    const fila = filas[i % filas.length];
    while (fila.length) {
      const disco = fila.shift();
      const chave = `${disco.artista}|${disco.titulo}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      resultado.push(disco);
      break;
    }
  }
  return resultado;
}

/** Prateleiras da página inicial: só discos com capa. Se uma falhar, ela vem vazia. */
export async function getVitrine() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  if (!supabaseServer) return { chegaram: [], procurados: [], importados: [], total: 0 };

  const [chegaram, procurados, importados, total] = await Promise.all([
    // As caixas 50 e 51 da Loja 1 recebem os discos que acabaram de chegar.
    ativosComCapa().eq('loja', 'Loja 1').in('caixa', ['50', '51'])
      .order('criado_em', { ascending: false }).limit(POR_PRATELEIRA)
      .then(({ data, error }) => (error ? [] : data)),
    maisProcurados().catch(() => []),
    ativosComCapa().ilike('observacao', '%importado%').order('criado_em', { ascending: false }).limit(POR_PRATELEIRA)
      .then(({ data, error }) => (error ? [] : data)),
    supabaseServer.from('discos').select('id', { count: 'exact', head: true })
      .eq('ativo', true).eq('deletado', false)
      .then(({ count }) => count || 0),
  ]);

  const data = { chegaram, procurados, importados, total };
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
