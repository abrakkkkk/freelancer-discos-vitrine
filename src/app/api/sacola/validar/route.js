import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isValidCategory } from '@/services/catalogService';
import { getCartItemKey } from '@/utils/cartUtils';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const itens = body?.itens || [];

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({
        disponiveis: [],
        indisponiveis: [],
        disponiveisKeys: [],
        indisponiveisKeys: [],
      });
    }

    if (!supabaseServer) {
      // Sem conexão ao banco (ex: teste estático): considera todos disponíveis
      return NextResponse.json({
        disponiveis: itens.map((i) => i.id),
        indisponiveis: [],
        disponiveisKeys: itens.map((i) => getCartItemKey(i)),
        indisponiveisKeys: [],
      });
    }

    // Agrupa por categoria válida (whitelist estrita)
    const porCategoria = new Map();
    itens.forEach((item) => {
      const cat = item.categoria || 'discos';
      if (!isValidCategory(cat)) return;
      if (!porCategoria.has(cat)) porCategoria.set(cat, []);
      porCategoria.get(cat).push(item.id);
    });

    const disponiveisKeySet = new Set();

    for (const [cat, ids] of porCategoria.entries()) {
      try {
        const { data, error } = await supabaseServer
          .from(cat)
          .select('id')
          .in('id', ids)
          .eq('deletado', false)
          .eq('ativo', true);

        if (!error && Array.isArray(data)) {
          data.forEach((row) => disponiveisKeySet.add(`${cat}:${row.id}`));
        }
      } catch (err) {
        console.error(`Erro ao validar itens de ${cat}:`, err);
      }
    }

    const disponiveis = [];
    const indisponiveis = [];
    const disponiveisKeys = [];
    const indisponiveisKeys = [];

    itens.forEach((item) => {
      const key = getCartItemKey(item);
      if (disponiveisKeySet.has(key)) {
        disponiveis.push(item.id);
        disponiveisKeys.push(key);
      } else {
        indisponiveis.push(item.id);
        indisponiveisKeys.push(key);
      }
    });

    return NextResponse.json({
      disponiveis,
      indisponiveis,
      disponiveisKeys,
      indisponiveisKeys,
    });
  } catch (error) {
    console.error('Erro ao validar sacola:', error);
    return NextResponse.json(
      { error: 'Falha ao validar itens da sacola' },
      { status: 500 }
    );
  }
}
