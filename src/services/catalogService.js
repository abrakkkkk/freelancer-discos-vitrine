import { supabaseServer } from '@/lib/supabaseServer';
import { removeAcentos, extractSearchTokens, calculateItemRelevance } from '@/utils/stringUtils';

export const VALID_CATEGORIES = ['discos', 'cds', 'dvds', 'vhs'];
const CATALOG_CACHE_TTL_MS = 60 * 1000;
const catalogServerCache = new Map();

export function isValidCategory(category) {
  return VALID_CATEGORIES.includes(category);
}

export function aplicarFiltroCaixaNaQuery(query, filtroCaixa) {
  if (!filtroCaixa) return query;

  const matchSufixoB = filtroCaixa.match(/^(?:caixa|c)?\s*(\d+)\s*b$/i);
  const matchNumeroPuro = filtroCaixa.match(/^(?:caixa|c)?\s*(\d+)$/i);

  if (matchSufixoB) {
    const numero = matchSufixoB[1];
    return query.in('caixa', [`Caixa ${numero}B`, `Caixa ${numero}b`, `${numero}B`, `${numero}b`]);
  }

  if (matchNumeroPuro) {
    const numero = matchNumeroPuro[1];
    return query.in('caixa', [numero, `Caixa ${numero}`, `Caixa ${numero}B`]);
  }

  return query.eq('caixa', filtroCaixa);
}

export const catalogService = {
  async fetchItems(category = 'discos', {
    pagina = 1,
    itensPorPagina = 50,
    filtroLoja = '',
    filtroCaixa = '',
    busca = '',
    ordenarColuna = null,
    ordenarDirecao = null,
  } = {}) {
    if (!isValidCategory(category)) {
      throw new Error(`Categoria inválida: ${category}`);
    }

    if (!supabaseServer) {
      return { data: [], count: 0 };
    }

    const cacheKey = `${category}|${pagina}|${itensPorPagina}|${filtroLoja}|${filtroCaixa}|${busca}|${ordenarColuna || ''}|${ordenarDirecao || ''}`;
    const cached = catalogServerCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const isVideo = category === 'dvds' || category === 'vhs';
    let colunas = 'id, titulo, preco, loja, caixa, ano, capa_url, observacao';
    if (!isVideo) {
      colunas += ', artista';
    }

    // Regra Estrita: Somente itens ativos e não deletados
    let query = supabaseServer
      .from(category)
      .select(colunas, { count: 'exact' })
      .eq('deletado', false)
      .eq('ativo', true);

    if (filtroLoja) {
      query = query.eq('loja', filtroLoja);
    }

    query = aplicarFiltroCaixaNaQuery(query, filtroCaixa);

    // Ordenação
    if (ordenarColuna && ordenarDirecao) {
      const crescente = ordenarDirecao === 'asc';
      // Se for DVD/VHS e tentou ordenar por artista, redireciona para título
      const colunaReal = (isVideo && ordenarColuna === 'artista') ? 'titulo' : ordenarColuna;
      query = query.order(colunaReal, { ascending: crescente, nullsFirst: false });
    } else {
      if (category === 'discos') query = query.order('caixa');
      if (!isVideo) query = query.order('artista');
      query = query.order('titulo');
    }

    let tokensBusca = null;
    if (busca) {
      tokensBusca = extractSearchTokens(busca);
      const { effectiveWords } = tokensBusca;

      effectiveWords.forEach((palavra) => {
        const palavraComCuringa = palavra.replace(/[aeiou]/g, '_');
        if (isVideo) {
          query = query.ilike('titulo', `%${palavraComCuringa}%`);
        } else {
          query = query.or(
            `titulo.ilike.%${palavraComCuringa}%,artista.ilike.%${palavraComCuringa}%,caixa.ilike.%${palavraComCuringa}%`
          );
        }
      });
      query = query.limit(3000);
    } else {
      query = query.range((pagina - 1) * itensPorPagina, pagina * itensPorPagina - 1);
    }

    const { data: dadosBrutos, count, error } = await query;
    if (error) {
      console.error('Erro na consulta do catálogo:', error);
      throw error;
    }

    let itensFiltrados = dadosBrutos || [];

    // Refinamento em memória
    if (busca && tokensBusca) {
      const { allWords, effectiveWords } = tokensBusca;

      itensFiltrados = itensFiltrados.filter((item) => {
        const tituloSemAcento = removeAcentos(item.titulo || '');
        const artistaSemAcento = removeAcentos(item.artista || '');
        const caixaSemAcento = removeAcentos(item.caixa || '');
        const caixaSemEspaco = caixaSemAcento.replace(/\s+/g, '');

        return effectiveWords.every((palavra) => {
          const palavraSemEspaco = palavra.replace(/\s+/g, '');
          if (isVideo) {
            return tituloSemAcento.includes(palavra);
          }
          return (
            tituloSemAcento.includes(palavra) ||
            artistaSemAcento.includes(palavra) ||
            caixaSemAcento.includes(palavra) ||
            (palavraSemEspaco && caixaSemEspaco.includes(palavraSemEspaco))
          );
        });
      });

      if (!ordenarColuna) {
        itensFiltrados.sort((itemA, itemB) => {
          const pontuacaoA = calculateItemRelevance(itemA, allWords, effectiveWords, isVideo);
          const pontuacaoB = calculateItemRelevance(itemB, allWords, effectiveWords, isVideo);
          return pontuacaoB - pontuacaoA;
        });
      }

      const inicio = (pagina - 1) * itensPorPagina;
      const paginados = itensFiltrados.slice(inicio, inicio + itensPorPagina);
      const searchResult = { data: paginados, count: itensFiltrados.length };
      catalogServerCache.set(cacheKey, {
        result: searchResult,
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      });
      return searchResult;
    }

    const finalResult = { data: itensFiltrados, count: count || 0 };
    catalogServerCache.set(cacheKey, {
      result: finalResult,
      expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
    });
    return finalResult;
  },
};
