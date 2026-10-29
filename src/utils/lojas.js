// Lojas com página própria em /lojas/[loja].
const LOJAS_POR_SLUG = {
  'loja-1': 'Loja 1',
  'loja-2': 'Loja 2',
};

/** Nome da loja a partir do slug da URL, ou null se a loja não existir. */
export function nomeLojaPorSlug(slug) {
  return LOJAS_POR_SLUG[slug] || null;
}
