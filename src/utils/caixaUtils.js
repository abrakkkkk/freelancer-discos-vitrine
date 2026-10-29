// Regra única de identificação das caixas, usada tanto na contagem (página da loja)
// quanto na listagem (página da caixa e filtro do catálogo). Mantê-las juntas evita
// que uma caixa mostre N itens no card e outra quantidade ao ser aberta.
//
// Loja 1: caixas numéricas ("5" ou "Caixa 5")         -> chave "5"
// Loja 2: caixas com sufixo B ("5B", "Caixa 5B")      -> chave "Caixa 5B"
//         número puro na Loja 2 também vira "Caixa 5B"

const RE_SUFIXO_B = /^(?:caixa|c)?\s*(\d+)\s*b$/i;
const RE_NUMERO = /^(?:caixa|c)?\s*(\d+)$/i;

/** Chave canônica de uma caixa como gravada no banco. */
export function chaveCaixa(raw, loja) {
  const valor = String(raw ?? '').trim();
  if (!valor) return '';
  const matchB = valor.match(RE_SUFIXO_B);
  const matchNum = valor.match(RE_NUMERO);
  if (loja === 'Loja 2') {
    if (matchB) return `Caixa ${matchB[1]}B`;
    if (matchNum) return `Caixa ${matchNum[1]}B`;
  } else if (loja === 'Loja 1' && matchNum) {
    return matchNum[1];
  }
  return valor;
}

/** Loja à qual uma chave de caixa pertence pelo formato (usado quando o filtro não tem loja). */
export function lojaPelaCaixa(chave) {
  const valor = String(chave ?? '').trim();
  if (RE_SUFIXO_B.test(valor)) return 'Loja 2';
  if (RE_NUMERO.test(valor)) return 'Loja 1';
  return null;
}

/**
 * Valores gravados no banco que correspondem a uma chave de caixa da loja informada.
 * É o inverso de chaveCaixa, para usar em `.in('caixa', ...)`.
 */
export function variantesCaixa(chave, loja) {
  const valor = String(chave ?? '').trim();
  if (!valor) return [];
  const matchB = valor.match(RE_SUFIXO_B);
  const matchNum = valor.match(RE_NUMERO);

  if (matchB) {
    const n = matchB[1];
    const variantes = [`Caixa ${n}B`, `Caixa ${n}b`, `${n}B`, `${n}b`];
    if (loja === 'Loja 2') variantes.push(n, `Caixa ${n}`);
    return variantes;
  }
  if (matchNum) {
    const n = matchNum[1];
    return [n, `Caixa ${n}`];
  }
  return [valor];
}
