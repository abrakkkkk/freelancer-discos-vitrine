import 'server-only';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { buscarFaixasDoDisco, headersDiscogs, valorParaGravar } from '@/utils/faixasDiscogs';

// Um lote grande do estoque não pode prender a função: o resto fica para o script.
const MAX_POR_AVISO = 25;

const semLista = (faixas) => !faixas?.faixas?.length;

/**
 * Busca e grava as faixas dos discos avisados pelo estoque que ainda não têm lista
 * (novos, ou já procurados sem sucesso: a edição pode ter trocado a capa).
 * Disco que já tem lista não é tocado.
 */
export async function preencherFaixasDosDiscos(ids) {
  const headers = headersDiscogs();
  if (!supabaseServer || !headers || !ids.length) return;

  const { data, error } = await supabaseServer
    .from('discos')
    .select('id, artista, titulo, ano, capa_url, faixas')
    .in('id', ids)
    .eq('deletado', false);
  if (error) {
    console.error('Faixas: erro ao ler os discos:', error.message);
    return;
  }

  for (const item of data.filter((d) => semLista(d.faixas)).slice(0, MAX_POR_AVISO)) {
    try {
      // Poucas tentativas: aqui não dá para esperar minutos; o que falhar fica sem marca e o script pega.
      const resultado = await buscarFaixasDoDisco(item, { headers, tentativas: 2 });
      const valor = valorParaGravar(resultado);
      let gravar = supabaseServer.from('discos').update({ faixas: valor }).eq('id', item.id);
      gravar = item.faixas === null ? gravar.is('faixas', null) : gravar.eq('faixas->faixas', '[]');
      const { error: erroGravar } = await gravar;
      if (erroGravar) console.error('Faixas: erro ao gravar:', erroGravar.message);
      else if (resultado) revalidatePath(`/disco/discos/${item.id}`);
    } catch (err) {
      console.error(`Faixas: disco ${item.id}:`, err.message);
    }
  }
}
