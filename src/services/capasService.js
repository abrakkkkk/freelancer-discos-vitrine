import 'server-only';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { findCover } from '@/services/coverService';

// Poucos por aviso: a busca divide o tempo da função com as faixas e o limite do Discogs.
const MAX_POR_AVISO = 10;

/**
 * Procura a capa dos itens avisados pelo estoque que ainda não têm capa, para o disco
 * novo já chegar à vitrine com capa sem depender de uma visita.
 * O que não for achado aqui continua sendo procurado pela /api/cover, como antes.
 */
export async function preencherCapasDosItens(categoria, ids) {
  if (!supabaseServer || !ids.length || categoria === 'dvds' || categoria === 'vhs') return;

  const { data, error } = await supabaseServer
    .from(categoria)
    .select('id, artista, titulo, ano, capa_url')
    .in('id', ids)
    .eq('deletado', false)
    .eq('ativo', true)
    .is('capa_url', null)
    .limit(MAX_POR_AVISO);
  if (error) {
    console.error('Capas: erro ao ler os itens:', error.message);
    return;
  }

  for (const item of data || []) {
    try {
      const anoItem = String(item.ano ?? '').trim();
      const encontrada = await findCover({
        artista: String(item.artista || '').trim(),
        titulo: String(item.titulo || '').trim(),
        ano: /^\d{4}$/.test(anoItem) ? anoItem : '',
      }, categoria);
      if (!encontrada?.cover) continue;

      // Só preenche capa vazia: nunca substitui uma capa já gravada.
      const { error: erroGravar } = await supabaseServer
        .from(categoria)
        .update({ capa_url: encontrada.cover })
        .eq('id', item.id)
        .is('capa_url', null);
      if (erroGravar) console.error('Capas: erro ao gravar:', erroGravar.message);
      else revalidatePath(`/disco/${categoria}/${item.id}`);
    } catch (err) {
      console.error(`Capas: item ${item.id}:`, err.message);
    }
  }
}
