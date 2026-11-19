/** Lista de faixas gravada em discos.faixas, ou null se não houver. */
export function faixasDoItem(item) {
  const valor = item?.faixas;
  return valor?.faixas?.length ? { faixas: valor.faixas, fonte: valor.fonte || null } : null;
}

// Onde a faixa fica, pela posição do Discogs:
// "A1", "B" (vinil) -> Lado A; "2-3" (CD duplo) -> Disco 2; "1", "" (CD) -> sem grupo.
function grupoDaPosicao(posicao) {
  const p = String(posicao || '').trim();
  const lado = p.match(/^([A-Z])(\d*)/i);
  if (lado) return { chave: `L${lado[1].toUpperCase()}`, nome: `Lado ${lado[1].toUpperCase()}`, numero: lado[2] };
  const disco = p.match(/^(\d+)[-.](\d+)$/);
  if (disco) return { chave: `D${disco[1]}`, nome: `Disco ${disco[1]}`, numero: disco[2] };
  return { chave: '', nome: '', numero: '' };
}

/**
 * Agrupa as faixas por lado (vinil) ou por disco (CD duplo) a partir da posição do Discogs.
 * Sem lado nem disco na posição (CD, "1", "2"), volta um grupo só, sem nome.
 */
export function agruparPorLado(faixas = []) {
  const grupos = [];
  for (const faixa of faixas) {
    const { chave, nome, numero } = grupoDaPosicao(faixa.posicao);
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.chave !== chave) {
      grupo = { chave, nome, faixas: [] };
      grupos.push(grupo);
    }
    grupo.faixas.push({ ...faixa, numero: numero || String(grupo.faixas.length + 1) });
  }
  // Um lado só, ou nenhum, não precisa de título.
  if (grupos.length === 1) grupos[0].nome = '';
  return grupos;
}
