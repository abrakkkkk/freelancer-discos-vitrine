import 'server-only';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { buscarFaixasDoDisco, buscarLancamentoParaGenero, generoParaGravar, headersDiscogs, valorParaGravar } from '@/utils/faixasDiscogs';
import { generosDoDisco } from '@/utils/generos';

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
    .select('id, artista, titulo, ano, capa_url, faixas, genero_discogs')
    .in('id', ids)
    .eq('deletado', false);
  if (error) {
    console.error('Faixas: erro ao ler os discos:', error.message);
    return;
  }

  // Lançamentos já baixados para as faixas: os gêneros saem deles, sem outra consulta.
  const lancamentos = new Map();

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
      if (resultado) {
        item.faixas = valor;
        lancamentos.set(item.id, { dados: resultado.generos, fonte: resultado.fonte });
      }
    } catch (err) {
      console.error(`Faixas: disco ${item.id}:`, err.message);
    }
  }

  await preencherGeneros(data, lancamentos, headers);
}

// Gêneros dos discos ainda não procurados (novos, ou de antes dos gêneros existirem).
// A tradução pelo artista fica para o script, que vê o catálogo inteiro.
async function preencherGeneros(discos, lancamentos, headers) {
  for (const item of discos.filter((d) => d.genero_discogs === null).slice(0, MAX_POR_AVISO)) {
    try {
      const lancamento = lancamentos.get(item.id) || (await buscarLancamentoParaGenero(item, { headers, tentativas: 2 }));
      const generoDiscogs = generoParaGravar(lancamento);
      const generos = generosDoDisco(generoDiscogs, (item.faixas?.faixas || []).map((f) => f.titulo));
      const { error } = await supabaseServer
        .from('discos')
        .update({ genero_discogs: generoDiscogs, generos: generos.length ? generos : null })
        .eq('id', item.id)
        .is('genero_discogs', null);
      if (error) console.error('Gêneros: erro ao gravar:', error.message);
      else if (generos.length) revalidatePath(`/disco/discos/${item.id}`);
    } catch (err) {
      console.error(`Gêneros: disco ${item.id}:`, err.message);
    }
  }
}
