// Filtros do catálogo na URL (?categoria=cds&busca=beatles&loja=Loja+1&caixa=5&ordem=preco_asc&pagina=2),
// para o link poder ser compartilhado e o F5 não perder a busca.

export const ESTADO_PADRAO = {
  categoria: 'discos',
  busca: '',
  loja: '',
  caixa: '',
  ordenacao: 'padrao',
  pagina: 1,
};

const CATEGORIAS = ['discos', 'cds', 'dvds', 'vhs'];
const LOJAS = ['Loja 1', 'Loja 2'];
const ORDENACOES = ['padrao', 'preco_asc', 'preco_desc', 'artista_asc', 'titulo_asc'];
const PARAMETROS = ['categoria', 'busca', 'loja', 'caixa', 'ordem', 'pagina'];

/** Estado do catálogo lido da URL, ou null se a URL não tiver nenhum filtro. */
export function lerEstadoDaUrl(searchParams) {
  if (!searchParams || !PARAMETROS.some((p) => searchParams.has(p))) return null;

  const categoria = searchParams.get('categoria');
  const loja = searchParams.get('loja');
  const ordem = searchParams.get('ordem');
  const pagina = Number.parseInt(searchParams.get('pagina') || '1', 10);
  const isVideo = categoria === 'dvds' || categoria === 'vhs';

  let ordenacao = ORDENACOES.includes(ordem) ? ordem : ESTADO_PADRAO.ordenacao;
  // DVDs e VHS não têm artista: mesma troca que o seletor de ordenação faz.
  if (isVideo && ordenacao === 'artista_asc') ordenacao = 'titulo_asc';

  return {
    categoria: CATEGORIAS.includes(categoria) ? categoria : ESTADO_PADRAO.categoria,
    busca: (searchParams.get('busca') || '').slice(0, 100),
    loja: LOJAS.includes(loja) ? loja : '',
    caixa: (searchParams.get('caixa') || '').slice(0, 40),
    ordenacao,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  };
}

/** Query string do estado, sem os valores padrão (URL curta). Ex.: "busca=abba&pagina=2". */
export function montarQueryDoEstado(estado) {
  const params = new URLSearchParams();
  if (estado.categoria && estado.categoria !== ESTADO_PADRAO.categoria) params.set('categoria', estado.categoria);
  if (estado.busca) params.set('busca', estado.busca);
  if (estado.loja) params.set('loja', estado.loja);
  if (estado.caixa) params.set('caixa', estado.caixa);
  if (estado.ordenacao && estado.ordenacao !== ESTADO_PADRAO.ordenacao) params.set('ordem', estado.ordenacao);
  if (estado.pagina > 1) params.set('pagina', String(estado.pagina));
  return params.toString();
}
