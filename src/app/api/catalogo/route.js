import { NextResponse } from 'next/server';
import { catalogService, isValidCategory } from '@/services/catalogService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') || 'discos';

    if (!isValidCategory(categoria)) {
      return NextResponse.json(
        { error: 'Categoria de catálogo inválida' },
        { status: 400 }
      );
    }

    const loja = searchParams.get('loja') || '';
    const caixa = searchParams.get('caixa') || '';
    // Limite de tamanho: cada palavra vira um filtro no banco.
    const busca = (searchParams.get('busca') || '').slice(0, 100);
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10) || 1);
    const ordenarColuna = searchParams.get('ordenarColuna') || null;
    const ordenarDirecao = searchParams.get('ordenarDirecao') || null;

    const itensPorPagina = 40;

    const { data: itens, count } = await catalogService.fetchItems(categoria, {
      pagina,
      itensPorPagina,
      filtroLoja: loja,
      filtroCaixa: caixa,
      busca,
      ordenarColuna,
      ordenarDirecao,
    });

    const totalPaginas = Math.max(1, Math.ceil(count / itensPorPagina));

    return NextResponse.json({
      itens,
      total: count,
      pagina,
      totalPaginas,
    });
  } catch (error) {
    console.error('Erro no endpoint /api/catalogo:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar catálogo de produtos' },
      { status: 500 }
    );
  }
}
