import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isValidCategory } from '@/services/catalogService';
import { getCartItemKey } from '@/utils/cartUtils';

export const dynamic = 'force-dynamic';

const MAX_ITENS = 100;

// Falha na verificação: o cliente NÃO deve remover nada da sacola. A disponibilidade
// é confirmada depois pelo WhatsApp (ver aviso na sacola).
function falhaVerificacao(motivo) {
  return NextResponse.json({ error: motivo }, { status: 503 });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const itens = body?.itens || [];

    if (!Array.isArray(itens) || itens.length > MAX_ITENS) {
      return NextResponse.json({ error: 'Lista de itens inválida' }, { status: 400 });
    }

    if (itens.length === 0) {
      return NextResponse.json({
        disponiveis: [],
        indisponiveis: [],
        disponiveisKeys: [],
        indisponiveisKeys: [],
      });
    }

    if (!supabaseServer) {
      return falhaVerificacao('Banco de dados indisponível');
    }

    // Agrupa por categoria válida (whitelist estrita). Ids não inteiros não existem
    // no banco e ficam como indisponíveis, sem derrubar a consulta inteira.
    const porCategoria = new Map();
    itens.forEach((item) => {
      const cat = item?.categoria || 'discos';
      const id = Number(item?.id);
      if (!isValidCategory(cat) || !Number.isInteger(id) || id <= 0) return;
      if (!porCategoria.has(cat)) porCategoria.set(cat, []);
      porCategoria.get(cat).push(id);
    });

    const disponiveisKeySet = new Set();

    const resultados = await Promise.all(
      [...porCategoria.entries()].map(async ([cat, ids]) => {
        const { data, error } = await supabaseServer
          .from(cat)
          .select('id')
          .in('id', ids)
          .eq('deletado', false)
          .eq('ativo', true);
        return { cat, data, error };
      })
    );

    for (const { cat, data, error } of resultados) {
      if (error) {
        console.error(`Erro ao validar itens de ${cat}:`, error.message);
        return falhaVerificacao('Falha ao verificar o estoque');
      }
      (data || []).forEach((row) => disponiveisKeySet.add(`${cat}:${row.id}`));
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
