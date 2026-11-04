// Lojas com página própria em /lojas/[loja].
const LOJAS_POR_SLUG = {
  'loja-1': 'Loja 1',
  'loja-2': 'Loja 2',
};

/** Nome da loja a partir do slug da URL, ou null se a loja não existir. */
export function nomeLojaPorSlug(slug) {
  return LOJAS_POR_SLUG[slug] || null;
}

/** Endereço da página da caixa do item, ou null quando a loja não tem página própria. */
export function hrefDaCaixa(loja, caixa) {
  const slug = Object.keys(LOJAS_POR_SLUG).find((s) => LOJAS_POR_SLUG[s] === loja);
  const valor = String(caixa ?? '').trim();
  return slug && valor ? `/lojas/${slug}/${encodeURIComponent(valor)}` : null;
}
