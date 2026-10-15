import { NextResponse } from 'next/server';
import { caixaService } from '@/services/caixaService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const loja = searchParams.get('loja') || '';

    const caixas = await caixaService.getCaixasComContagem(loja);
    return NextResponse.json({ caixas });
  } catch (error) {
    console.error('Erro no endpoint /api/caixas:', error);
    return NextResponse.json({ error: 'Falha ao buscar caixas' }, { status: 500 });
  }
}
