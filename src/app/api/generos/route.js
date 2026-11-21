import { NextResponse } from 'next/server';
import { contarDiscosPorGenero } from '@/services/catalogService';
import { GENEROS } from '@/utils/generos';

export const dynamic = 'force-dynamic';

// Quantos LPs há em cada gênero. A CDN guarda por 1 hora: a contagem roda poucas vezes por dia.
export async function GET() {
  try {
    const contagem = await contarDiscosPorGenero(GENEROS.map((g) => g.id));
    return NextResponse.json(
      { contagem },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('Erro no endpoint /api/generos:', error);
    return NextResponse.json({ error: 'Falha ao contar os gêneros' }, { status: 500 });
  }
}
