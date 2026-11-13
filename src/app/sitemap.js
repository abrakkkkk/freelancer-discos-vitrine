import { supabaseServer } from '@/lib/supabaseServer';
import { caixaService } from '@/services/caixaService';
import { VALID_CATEGORIES } from '@/services/catalogService';
import { hrefDaCaixa } from '@/utils/lojas';

const SITE = 'https://freelancerdiscos.com.br';
const PAGINA = 1000;

// O estoque muda o tempo todo: o sitemap é refeito a cada hora.
export const revalidate = 3600;

// Ids de todos os itens à venda de uma categoria (o banco devolve no máximo 1000 por vez).
async function idsDaCategoria(categoria) {
  const ids = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabaseServer
      .from(categoria)
      .select('id')
      .eq('deletado', false)
      .eq('ativo', true)
      .order('id')
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(`Sitemap: erro ao listar ${categoria}: ${error.message}`);
    ids.push(...(data || []).map((d) => d.id));
    if (!data || data.length < PAGINA) return ids;
  }
}

export default async function sitemap() {
  const agora = new Date();
  const fixas = [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/lojas`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE}/lojas/loja-1`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE}/lojas/loja-2`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE}/compartilhar`, changeFrequency: 'monthly', priority: 0.3 },
  ].map((p) => ({ ...p, lastModified: agora }));

  if (!supabaseServer) return fixas;

  // Caixas com itens e a página de cada disco à venda. Se o banco falhar,
  // o sitemap sai só com as páginas fixas em vez de quebrar.
  try {
    const [caixasLoja1, caixasLoja2, ...idsPorCategoria] = await Promise.all([
      caixaService.getCaixasComContagem('Loja 1'),
      caixaService.getCaixasComContagem('Loja 2'),
      ...VALID_CATEGORIES.map(idsDaCategoria),
    ]);

    const caixas = [...caixasLoja1, ...caixasLoja2]
      .filter((cx) => cx.total > 0)
      .map((cx) => hrefDaCaixa(cx.loja, cx.caixa))
      .filter(Boolean)
      .map((href) => ({ url: `${SITE}${href}`, lastModified: agora, changeFrequency: 'daily', priority: 0.6 }));

    const discos = VALID_CATEGORIES.flatMap((categoria, i) =>
      idsPorCategoria[i].map((id) => ({
        url: `${SITE}/disco/${categoria}/${id}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      }))
    );

    return [...fixas, ...caixas, ...discos];
  } catch (erro) {
    console.error(erro);
    return fixas;
  }
}
