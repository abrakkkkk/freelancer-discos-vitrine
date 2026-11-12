import { supabaseServer } from '@/lib/supabaseServer';
import {
  removeAcentos,
  extractSearchTokens,
  createRelevanceScorer,
  accentInsensitivePattern,
  palavraParecida,
  toleranciaDigitacao,
} from '@/utils/stringUtils';
import { chaveCaixa, lojaPelaCaixa, variantesCaixa } from '@/utils/caixaUtils';

export const VALID_CATEGORIES = ['discos', 'cds', 'dvds', 'vhs'];
// Colunas que o cliente pode usar para ordenar. Qualquer outra é ignorada (antes ia
// direto para .order(), permitindo ordenar por colunas internas ou causar erro 500).
const COLUNAS_ORDENAVEIS = ['preco', 'artista', 'titulo'];
const DIRECOES_ORDENACAO = ['asc', 'desc'];
const CATALOG_CACHE_TTL_MS = 60 * 1000;
const catalogServerCache = new Map();

export function isValidCategory(category) {
  return VALID_CATEGORIES.includes(category);
}

export function aplicarFiltroCaixaNaQuery(query, filtroCaixa, filtroLoja = '') {
  if (!filtroCaixa) return query;

  // Sem loja escolhida, o formato da caixa diz a loja ("5" é da Loja 1, "Caixa 5B" da Loja 2).
  // Antes, "Caixa 5" sem loja trazia também os itens da Caixa 5B da Loja 2.
  const loja = filtroLoja || lojaPelaCaixa(filtroCaixa);
  const chave = chaveCaixa(filtroCaixa, loja);
  let filtrada = query.in('caixa', variantesCaixa(chave, loja));

  if (!filtroLoja && loja === 'Loja 2') {
    filtrada = filtrada.eq('loja', 'Loja 2');
  } else if (!filtroLoja && loja === 'Loja 1') {
    // Número puro na Loja 2 é contado como caixa B, então não pertence a esta caixa.
    filtrada = filtrada.or('loja.is.null,loja.neq."Loja 2"');
  }
  return filtrada;
}

// Pedaços de 3 letras do começo, do meio e do fim: com um erro de digitação, pelo menos um
// deles continua certo. Sem curinga nas vogais, que deixaria a busca genérica demais.
function pedacosDaPalavra(palavra) {
  const meio = Math.max(0, Math.floor((palavra.length - 3) / 2));
  return [...new Set([palavra.slice(0, 3), palavra.slice(meio, meio + 3), palavra.slice(-3)])];
}

async function buscarComErroDeDigitacao(category, {
  effectiveWords,
  isVideo,
  colunas,
  filtroLoja,
  filtroCaixa,
  ordenarColuna,
  ordenarDirecao,
}) {
  const palavrasLongas = effectiveWords.filter((p) => toleranciaDigitacao(p) > 0);
  const campos = isVideo ? ['titulo'] : ['titulo', 'artista'];
  let query = supabaseServer
    .from(category)
    .select(colunas)
    .eq('deletado', false)
    .eq('ativo', true);
  // Cada palavra precisa bater por algum pedaço (E entre palavras, OU entre pedaços).
  palavrasLongas.forEach((palavra) => {
    const condicoes = pedacosDaPalavra(palavra).flatMap((pedaco) =>
      campos.map((campo) => `${campo}.ilike.%${pedaco}%`)
    );
    query = query.or(condicoes.join(','));
  });
  if (filtroLoja) query = query.eq('loja', filtroLoja);
  query = aplicarFiltroCaixaNaQuery(query, filtroCaixa, filtroLoja);
  if (ordenarColuna && ordenarDirecao) {
    const colunaReal = isVideo && ordenarColuna === 'artista' ? 'titulo' : ordenarColuna;
    query = query.order(colunaReal, { ascending: ordenarDirecao === 'asc', nullsFirst: false });
  }

  const { data, error } = await query.limit(3000);
  if (error) {
    // A segunda tentativa é um extra: se falhar, fica o "nada encontrado" da busca exata.
    console.error('Erro na busca com erro de digitação:', error);
    return [];
  }

  return (data || []).filter((item) => {
    const texto = removeAcentos(`${isVideo ? '' : item.artista || ''} ${item.titulo || ''}`);
    return effectiveWords.every((palavra) => palavraParecida(palavra, texto));
  });
}

// Ordem padrão dos discos: loja, número da caixa (como número: 1, 2 … 10, não 1, 10, 2) e
// título, a mesma ordem do caixote físico. O banco só ordena a coluna "caixa" como texto,
// então a ordem é montada aqui sobre id/loja/caixa/título e guardada por 60 s.
const SUPABASE_PAGE_SIZE = 1000;
const ordemDiscosCache = new Map();
const comparadorTexto = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true, ignorePunctuation: true });

function chaveOrdemCaixa(item) {
  const loja = item.loja || 'Loja 1';
  const rankLoja = loja === 'Loja 1' ? 0 : loja === 'Loja 2' ? 1 : 2;
  const raw = String(item.caixa ?? '').trim();
  if (!raw) return { rankLoja: 3, numero: 0, texto: '' };
  const numero = parseInt(raw.replace(/\D/g, ''), 10);
  return {
    rankLoja,
    numero: Number.isNaN(numero) ? Number.MAX_SAFE_INTEGER : numero,
    texto: chaveCaixa(raw, loja),
  };
}

async function idsDiscosEmOrdem(filtroLoja) {
  const cacheKey = filtroLoja || '__ALL__';
  const cached = ordemDiscosCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.resultado;

  const consulta = (inicio) => {
    let q = supabaseServer
      .from('discos')
      .select('id, loja, caixa, titulo', { count: 'exact' })
      .eq('deletado', false)
      .eq('ativo', true)
      .order('id')
      .range(inicio, inicio + SUPABASE_PAGE_SIZE - 1);
    if (filtroLoja) q = q.eq('loja', filtroLoja);
    return q;
  };

  const primeira = await consulta(0);
  if (primeira.error) throw primeira.error;
  let linhas = primeira.data || [];
  const total = primeira.count || linhas.length;
  const restantes = [];
  for (let inicio = SUPABASE_PAGE_SIZE; inicio < total; inicio += SUPABASE_PAGE_SIZE) {
    restantes.push(consulta(inicio));
  }
  for (const res of await Promise.all(restantes)) {
    if (res.error) throw res.error;
    linhas = linhas.concat(res.data || []);
  }

  const comChave = linhas.map((item) => ({ item, chave: chaveOrdemCaixa(item) }));
  comChave.sort((a, b) =>
    a.chave.rankLoja - b.chave.rankLoja ||
    a.chave.numero - b.chave.numero ||
    comparadorTexto.compare(a.chave.texto, b.chave.texto) ||
    comparadorTexto.compare(a.item.titulo || '', b.item.titulo || '') ||
    String(a.item.id).localeCompare(String(b.item.id))
  );
  // Posição de cada disco dentro da sua caixa, para o cabeçalho avisar quando a caixa
  // começou na página anterior ("continuação, 41–80 de 118").
  const ids = comChave.map(({ item }) => item.id);
  const posicoes = new Map();
  let inicioGrupo = 0;
  for (let i = 1; i <= comChave.length; i++) {
    const atual = comChave[i];
    const anterior = comChave[i - 1];
    const mudou = !atual ||
      atual.chave.rankLoja !== anterior.chave.rankLoja ||
      atual.chave.texto !== anterior.chave.texto;
    if (!mudou) continue;
    const total = i - inicioGrupo;
    for (let j = inicioGrupo; j < i; j++) {
      posicoes.set(comChave[j].item.id, { posicao: j - inicioGrupo + 1, total });
    }
    inicioGrupo = i;
  }
  const resultado = { ids, posicoes };
  ordemDiscosCache.set(cacheKey, { resultado, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS });
  return resultado;
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

    if (!COLUNAS_ORDENAVEIS.includes(ordenarColuna) || !DIRECOES_ORDENACAO.includes(ordenarDirecao)) {
      ordenarColuna = null;
      ordenarDirecao = null;
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

    // Catálogo padrão de discos: caixa por número e título (ver idsDiscosEmOrdem).
    if (category === 'discos' && !busca && !filtroCaixa && !ordenarColuna) {
      const { ids, posicoes } = await idsDiscosEmOrdem(filtroLoja);
      const idsPagina = ids.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
      let itensPagina = [];
      if (idsPagina.length > 0) {
        const { data, error } = await supabaseServer
          .from('discos')
          .select(colunas)
          .in('id', idsPagina);
        if (error) {
          console.error('Erro na consulta do catálogo:', error);
          throw error;
        }
        const porId = new Map((data || []).map((item) => [item.id, item]));
        itensPagina = idsPagina
          .filter((id) => porId.has(id))
          .map((id) => ({
            ...porId.get(id),
            posicaoNaCaixa: posicoes.get(id)?.posicao,
            totalNaCaixa: posicoes.get(id)?.total,
          }));
      }
      const resultado = { data: itensPagina, count: ids.length };
      catalogServerCache.set(cacheKey, {
        result: resultado,
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      });
      return resultado;
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

    query = aplicarFiltroCaixaNaQuery(query, filtroCaixa, filtroLoja);

    // Ordenação
    if (ordenarColuna && ordenarDirecao) {
      const crescente = ordenarDirecao === 'asc';
      // Se for DVD/VHS e tentou ordenar por artista, redireciona para título
      const colunaReal = (isVideo && ordenarColuna === 'artista') ? 'titulo' : ordenarColuna;
      query = query.order(colunaReal, { ascending: crescente, nullsFirst: false });
    } else {
      // Discos numa caixa só (filtro de caixa): título, como no caixote e na página da caixa.
      if (category === 'discos') {
        query = query.order('titulo');
      } else {
        if (!isVideo) query = query.order('artista');
        query = query.order('titulo');
      }
    }

    let tokensBusca = null;
    if (busca) {
      tokensBusca = extractSearchTokens(busca);
      const { effectiveWords } = tokensBusca;

      effectiveWords.forEach((palavra) => {
        const padrao = accentInsensitivePattern(palavra);
        if (isVideo) {
          query = query.filter('titulo', 'imatch', padrao);
        } else {
          query = query.or(`titulo.imatch."${padrao}",artista.imatch."${padrao}",caixa.imatch."${padrao}"`);
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
      const { effectiveWords } = tokensBusca;

      const filtrarExato = (lista) => lista.filter((item) => {
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
      itensFiltrados = filtrarExato(itensFiltrados);

      // Nada exato: tenta de novo aceitando erro de digitação ("beatls" acha "beatles").
      // Os resultados aparecem normalmente, sem aviso de correção.
      if (itensFiltrados.length === 0 && effectiveWords.some((p) => toleranciaDigitacao(p) > 0)) {
        itensFiltrados = await buscarComErroDeDigitacao(category, {
          effectiveWords,
          isVideo,
          colunas,
          filtroLoja,
          filtroCaixa,
          ordenarColuna,
          ordenarDirecao,
        });
      }

      if (!ordenarColuna) {
        const pontuar = createRelevanceScorer(tokensBusca, isVideo);
        const pontuacoes = new Map(itensFiltrados.map((item) => [item, pontuar(item)]));
        itensFiltrados.sort((itemA, itemB) => pontuacoes.get(itemB) - pontuacoes.get(itemA));
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
