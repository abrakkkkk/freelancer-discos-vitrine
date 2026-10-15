import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const itens = body?.itens || [];

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ disponiveis: [], indisponiveis: [] });
    }

    if (!supabaseServer) {
      // Sem conexão ao banco (ex: teste estático): considera todos disponíveis
      return NextResponse.json({
        disponiveis: itens.map((i) => i.id),
        indisponiveis: [],
      });
    }

    // Agrupa por categoria
    const porCategoria = new Map();
    itens.forEach((item) => {
      const cat = item.categoria || 'discos';
      if (!porCategoria.has(cat)) porCategoria.set(cat, []);
      porCategoria.get(cat).push(item.id);
    });

    const disponiveisSet = new Set();

    for (const [cat, ids] of porCategoria.entries()) {
      try {
        const { data, error } = await supabaseServer
          .from(cat)
          .select('id')
          .in('id', ids)
          .eq('deletado', false)
          .eq('ativo', true);

        if (!error && Array.isArray(data)) {
          data.forEach((row) => disponiveisSet.add(row.id));
        }
      } catch (err) {
        console.error(`Erro ao validar itens de ${cat}:`, err);
      }
    }

    const disponiveis = [];
    const indisponiveis = [];

    itens.forEach((item) => {
      if (disponiveisSet.has(item.id)) {
        disponiveis.push(item.id);
      } else {
        indisponiveis.push(item.id);
      }
    });

    return NextResponse.json({
      disponiveis,
      indisponiveis,
    });
  } catch (error) {
    console.error('Erro ao validar sacola:', error);
    return NextResponse.json(
      { error: 'Falha ao validar itens da sacola' },
      { status: 500 }
    );
  }
}
