/** Lista de faixas gravada em discos.faixas, ou null se não houver. */
export function faixasDoItem(item) {
  const valor = item?.faixas;
  return valor?.faixas?.length ? { faixas: valor.faixas, fonte: valor.fonte || null } : null;
}

/**
 * Agrupa as faixas por lado do disco a partir da posição do Discogs ("A1", "B2").
 * Sem lado na posição (CD, "1", "2"), volta um grupo só, sem nome.
 */
export function agruparPorLado(faixas = []) {
  const grupos = [];
  for (const faixa of faixas) {
    const m = String(faixa.posicao || '').trim().match(/^([A-Z])(\d*)/i);
    const lado = m ? m[1].toUpperCase() : '';
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.lado !== lado) {
      grupo = { lado, faixas: [] };
      grupos.push(grupo);
    }
    grupo.faixas.push({ ...faixa, numero: (m && m[2]) || String(grupo.faixas.length + 1) });
  }
  // Um lado só, ou nenhum, não precisa de título.
  if (grupos.length === 1) grupos[0].lado = '';
  return grupos;
}
