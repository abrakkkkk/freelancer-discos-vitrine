import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { isValidCategory } from '@/services/catalogService';

const MAX_IDS = 500;

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

  return Response.json({ revalidados: ids.length });
}
