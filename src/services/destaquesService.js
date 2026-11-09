import { supabaseServer } from '@/lib/supabaseServer';
import ranking from '@/data/destaques-lojas.json';

// Os discos mais famosos de cada loja vêm de src/data/destaques-lojas.json, gerado por
// scripts/ranking-destaques.mjs a partir do Deezer (fãs do artista e do álbum). Aqui só
// confirmamos quais ainda estão no estoque, com capa, e pegamos os 5 primeiros.

const POR_LOJA = 5;
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = null;

/** Retorna { 'Loja 1': [disco, ...], 'Loja 2': [...] } na ordem de fama do ranking. */
export async function getDestaquesPorLoja() {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  if (!supabaseServer) return {};

  const lojas = ranking?.lojas || {};
  const todosIds = Object.values(lojas).flatMap((artistas) => artistas.flatMap((a) => a.ids));
  if (todosIds.length === 0) return {};

  const { data, error } = await supabaseServer
    .from('discos')
    .select('id, artista, titulo, loja, caixa, capa_url')
    .in('id', todosIds)
    .eq('ativo', true)
    .eq('deletado', false)
    .not('capa_url', 'is', null);

  // Os destaques são um extra: se a consulta falhar, a página segue sem eles.
  if (error) {
    console.error('Erro ao buscar destaques das lojas:', error.message);
    return {};
  }

  const emEstoque = new Map((data || []).map((d) => [d.id, d]));
  const resultado = {};
  for (const [loja, artistas] of Object.entries(lojas)) {
    // O álbum mais famoso de cada artista; se saiu do estoque, o próximo disco dele.
    const discoDe = (artista) => artista.ids.map((id) => emEstoque.get(id)).find((d) => d && d.loja === loja);
    const fila = (brasileiro) =>
      artistas.filter((a) => Boolean(a.brasileiro) === brasileiro).map(discoDe).filter(Boolean);
    const estrangeiros = fila(false);
    const brasileiros = fila(true);

    // Alterna estrangeiro e brasileiro; se uma fila acabar, a outra completa.
    resultado[loja] = [];
    while (resultado[loja].length < POR_LOJA && (estrangeiros.length || brasileiros.length)) {
      const vezDoBrasileiro = resultado[loja].length % 2 === 1;
      const proximo = (vezDoBrasileiro ? brasileiros : estrangeiros).shift()
        ?? (vezDoBrasileiro ? estrangeiros : brasileiros).shift();
      resultado[loja].push(proximo);
    }
  }

  cache = { data: resultado, expiresAt: Date.now() + CACHE_TTL_MS };
  return resultado;
}
