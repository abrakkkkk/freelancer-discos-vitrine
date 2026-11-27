import 'server-only';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabaseServer';
import { buscarFaixasDoDisco, buscarLancamentoParaGenero, generoParaGravar, headersDiscogs, valorParaGravar } from '@/utils/faixasDiscogs';
import { analisarDisco, generoMaisComum, montarGeneros } from '@/utils/generos';
import { isVariousArtist } from '@/utils/coverMatch';

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
  if (!supabaseServer || !ids.length) return;

  const { data, error } = await supabaseServer
    .from('discos')
    .select('id, artista, titulo, ano, capa_url, faixas, genero_discogs, generos')
    .in('id', ids)
    .eq('deletado', false);
  if (error) {
    console.error('Faixas: erro ao ler os discos:', error.message);
    return;
  }

  // Lançamentos já baixados para as faixas: os gêneros saem deles, sem outra consulta.
  const lancamentos = new Map();

  // Sem chave do Discogs, ainda assim o disco ganha gênero (pelo artista ou "Outros").
  for (const item of headers ? data.filter((d) => semLista(d.faixas)).slice(0, MAX_POR_AVISO) : []) {
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

// Gênero principal de cada artista, pelos discos dele já classificados (fora os deste aviso).
async function generoPorArtista(discos) {
  const artistas = [...new Set(discos.map((d) => d.artista?.trim()).filter((a) => a && !isVariousArtist(a)))];
  const porArtista = new Map();
  if (!artistas.length) return porArtista;
  const { data, error } = await supabaseServer
    .from('discos')
    .select('artista, generos')
    .in('artista', artistas)
    .not('id', 'in', `(${discos.map((d) => d.id).join(',')})`)
    .not('generos', 'is', null)
    .eq('deletado', false);
  if (error) {
    console.error('Gêneros: erro ao ler os artistas:', error.message);
    return porArtista;
  }
  for (const artista of artistas) {
    const genero = generoMaisComum(data.filter((d) => d.artista?.trim() === artista).map((d) => d.generos));
    if (genero) porArtista.set(artista, genero);
  }
  return porArtista;
}

// Gêneros dos discos novos (ou de antes dos gêneros existirem): o mesmo que o script faz.
// 1. Discogs (estilos claros viram gêneros extras). 2. O gênero principal dos outros discos do
// artista vence, para os discos dele não ficarem espalhados. 3. Nada identificou: "Outros".
// Disco que o Discogs não respondeu fica com genero_discogs null: o script procura de novo.
async function preencherGeneros(discos, lancamentos, headers) {
  const pendentes = discos.filter((d) => d.genero_discogs === null || !d.generos?.length);
  if (!pendentes.length) return;
  const doArtista = await generoPorArtista(pendentes);

  for (const [i, item] of pendentes.entries()) {
    const atualizacao = {};
    let discogs = item.genero_discogs;
    // Discogs só para os primeiros do lote e os ainda não procurados; o resto usa o artista.
    if (discogs === null && headers && i < MAX_POR_AVISO) {
      try {
        const lancamento = lancamentos.get(item.id) || (await buscarLancamentoParaGenero(item, { headers, tentativas: 2 }));
        discogs = generoParaGravar(lancamento);
        atualizacao.genero_discogs = discogs;
      } catch (err) {
        console.error(`Gêneros: disco ${item.id}:`, err.message);
      }
    }
    const analise = analisarDisco(discogs, (item.faixas?.faixas || []).map((f) => f.titulo));
    const coletanea = isVariousArtist(item.artista) || !item.artista?.trim();
    atualizacao.generos = montarGeneros({
      principal: doArtista.get(item.artista?.trim()) || analise.principal,
      extras: analise.fortes,
      nacional: analise.nacional,
      coletanea,
    });

    let gravar = supabaseServer.from('discos').update(atualizacao).eq('id', item.id);
    // Não passa por cima do que o script gravou nesse meio-tempo.
    gravar = atualizacao.genero_discogs !== undefined ? gravar.is('genero_discogs', null) : gravar;
    const { error } = await gravar;
    if (error) console.error('Gêneros: erro ao gravar:', error.message);
    else revalidatePath(`/disco/discos/${item.id}`);
  }
}
