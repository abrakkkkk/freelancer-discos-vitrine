import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { isValidCategory } from '@/services/catalogService';
import { preencherCapasDosItens } from '@/services/capasService';
import { preencherFaixasDosDiscos } from '@/services/faixasService';

const MAX_IDS = 500;

// A busca das faixas roda depois da resposta; dá tempo para alguns discos no Discogs.
export const maxDuration = 60;

function chaveValida(recebida) {
  const esperada = process.env.REVALIDATE_SECRET;
  if (!esperada || !recebida) return false;
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!chaveValida(request.headers.get('x-revalidate-secret'))) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const corpo = await request.json().catch(() => null);
  const categoria = corpo?.categoria;
  if (!isValidCategory(categoria)) {
    return Response.json({ error: 'Categoria inválida.' }, { status: 400 });
  }

  const ids = [...new Set((Array.isArray(corpo.ids) ? corpo.ids : [])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0))].slice(0, MAX_IDS);

  ids.forEach((id) => revalidatePath(`/disco/${categoria}/${id}`));
  revalidatePath('/lojas', 'layout');
  // Home e prateleiras só se refazem sozinhas a cada hora: o aviso do estoque as atualiza já.
  revalidatePath('/');
  revalidatePath('/chegaram-agora');
  revalidatePath('/importados');

  // Item cadastrado ou editado no estoque já ganha capa e, se for disco, faixas e gêneros,
  // sem atrasar o estoque. A capa vem antes: assim a vitrine não precisa procurá-la a cada visita.
  after(async () => {
    await preencherCapasDosItens(categoria, ids);
    if (categoria === 'discos') await preencherFaixasDosDiscos(ids);
  });

  return Response.json({ revalidados: ids.length });
}
