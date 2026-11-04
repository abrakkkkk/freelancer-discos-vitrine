// Lojas com página própria em /lojas/[loja].
const LOJAS_POR_SLUG = {
  'loja-1': 'Loja 1',
  'loja-2': 'Loja 2',
};

/** Nome da loja a partir do slug da URL, ou null se a loja não existir. */
export function nomeLojaPorSlug(slug) {
  return LOJAS_POR_SLUG[slug] || null;
}

/**
 * Endereço da página da caixa do item, ou null quando a loja não tem página própria.
 * Vindo do catálogo, marca `?de=catalogo` para a seta da caixa voltar à busca.
 */
export function hrefDaCaixa(loja, caixa, { doCatalogo = false } = {}) {
  const slug = Object.keys(LOJAS_POR_SLUG).find((s) => LOJAS_POR_SLUG[s] === loja);
  const valor = String(caixa ?? '').trim();
  if (!slug || !valor) return null;
  return `/lojas/${slug}/${encodeURIComponent(valor)}${doCatalogo ? '?de=catalogo' : ''}`;
}
