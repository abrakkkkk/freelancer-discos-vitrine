import { supabaseServer } from '@/lib/supabaseServer';

const SEM_FAIXAS = { faixas: [] };

// Faixas de um disco, gravadas em discos.faixas pelo scripts/preencher-faixas.mjs.
export async function GET(request) {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!supabaseServer || !Number.isInteger(id) || id <= 0) {
    return Response.json(SEM_FAIXAS, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('discos')
    .select('faixas')
    .eq('id', id)
    .eq('deletado', false)
    .maybeSingle();

  if (error) return Response.json(SEM_FAIXAS, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const faixas = data?.faixas?.faixas?.length ? { faixas: data.faixas.faixas, fonte: data.faixas.fonte || null } : SEM_FAIXAS;
  return Response.json(faixas, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
  });
}
