export function removeAcentos(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function formatCaixa(caixa, loja) {
  if (!caixa) return '—';
  const str = String(caixa).trim();
  if (!str) return '—';

  const matchB = str.match(/^(\d+)\s*b$/i);
  if (matchB) {
    return `Caixa ${matchB[1]}B`;
  }

  if (str.toLowerCase().startsWith('caixa ')) {
    const matchCaixaB = str.match(/^caixa\s*(\d+)\s*b$/i);
    if (matchCaixaB) {
      return `Caixa ${matchCaixaB[1]}B`;
    }
    return str;
  }

  const isNumeric = !isNaN(Number(str)) && str !== '';
  if (loja === 'Loja 1' && isNumeric) {
    return `Caixa ${str}`;
  }
  return str;
}

export function extractRecordLabel(observacao) {
  if (!observacao) return null;
  const match = String(observacao).match(/\[(.*?)\]/);
  if (!match) return null;
  const inside = match[1].trim();
  const parts = inside.split('•').map((p) => p.trim());
  if (parts[0] && !/^\d{4}$/.test(parts[0])) {
    return parts[0];
  }
  return null;
}

export const MUSIC_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'of',
  'o', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'e',
  'el', 'la', 'los', 'las', 'del', 'y',
  'le', 'les', 'des', 'du', 'et',
  'feat', 'ft', 'featuring', 'vs', 'part'
]);

const SEARCH_NOISE = /[-–—:()/\_\\*~!?[\]+"',.;&]/g;

const ACCENT_CLASSES = {
  a: '[aáàâãäÁÀÂÃÄ]',
  e: '[eéèêëÉÈÊË]',
  i: '[iíìîïÍÌÎÏ]',
  o: '[oóòôõöÓÒÔÕÖ]',
  u: '[uúùûüÚÙÛÜ]',
  c: '[cçÇ]',
  n: '[nñÑ]',
  y: '[yýÿÝ]',
};

export function accentInsensitivePattern(palavra) {
  return [...removeAcentos(palavra)]
    .map((letra) => ACCENT_CLASSES[letra] || (/[a-z0-9]/.test(letra) ? letra : '.'))
    .join('');
}

const normalizeForMatch = (texto) => removeAcentos(texto).replace(SEARCH_NOISE, ' ').replace(/\s+/g, ' ').trim();
const escapeRegExp = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function extractSearchTokens(queryStr) {
  if (!queryStr) return { allWords: [], contentWords: [], effectiveWords: [], accentedWords: [] };

  const allWords = normalizeForMatch(queryStr).split(' ').filter(Boolean);
  const contentWords = allWords.filter(w => !MUSIC_STOP_WORDS.has(w) && w.length >= 2);
  const effectiveWords = contentWords.length > 0 ? contentWords : allWords;
  const accentedWords = queryStr
    .normalize('NFC')
    .toLowerCase()
    .replace(SEARCH_NOISE, ' ')
    .split(/\s+/)
    .filter((word) => word && word !== removeAcentos(word));

  return {
    allWords,
    contentWords,
    effectiveWords,
    accentedWords,
  };
}

/** Distância de edição (Levenshtein) entre duas palavras; para cedo acima de `maximo`. */
export function distanciaEdicao(a, b, maximo = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menorDaLinha = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo);
      if (atual[j] < menorDaLinha) menorDaLinha = atual[j];
    }
    if (menorDaLinha > maximo) return maximo + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/** Quantas letras erradas uma palavra da busca aceita: nenhuma em palavras curtas. */
export function toleranciaDigitacao(palavra) {
  if (palavra.length >= 7) return 2;
  if (palavra.length >= 4) return 1;
  return 0;
}

/**
 * A palavra da busca aparece no texto, exata ou com até `toleranciaDigitacao` letras
 * trocadas, faltando ou sobrando ("beatls" acha "beatles"). Texto já sem acentos.
 */
export function palavraParecida(palavra, texto) {
  if (!palavra) return false;
  if (texto.includes(palavra)) return true;
  const limite = toleranciaDigitacao(palavra);
  if (!limite) return false;
  return texto
    .split(/[^a-z0-9]+/)
    .some((t) => t.length >= 3 && distanciaEdicao(t, palavra, limite) <= limite);
}

export function createRelevanceScorer({ allWords = [], effectiveWords = [], accentedWords = [] }, isVideo = false) {
  const wordPatterns = effectiveWords.map((word) => ({
    word,
    wholeWord: new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}($|[^a-z0-9])`),
  }));
  const fullQuery = allWords.join(' ');

  return (item) => {
    if (!item) return 0;
    let score = 0;

    const itemTitulo = removeAcentos(item.titulo || '');
    const itemArtista = isVideo ? '' : removeAcentos(item.artista || '');
    const itemCaixa = removeAcentos(item.caixa || '');
    const fullText = `${itemArtista} ${itemTitulo} ${itemCaixa}`.trim();

    if (allWords.length > 0 && allWords.every(w => fullText.includes(w))) {
      score += 100;
    }

    let matchedEffective = 0;
    wordPatterns.forEach(({ word, wholeWord }) => {
      if (!fullText.includes(word)) return;
      matchedEffective++;
      score += 30;
      if (itemArtista.includes(word)) score += wholeWord.test(itemArtista) ? 60 : 20;
      if (itemTitulo.includes(word)) score += wholeWord.test(itemTitulo) ? 50 : 20;
    });

    if (effectiveWords.length > 0 && matchedEffective === effectiveWords.length) {
      score += 50;
    }

    if (fullQuery && (normalizeForMatch(itemArtista) === fullQuery || normalizeForMatch(itemTitulo) === fullQuery)) {
      score += 80;
    }

    if (accentedWords.length > 0) {
      const originalText = `${isVideo ? '' : item.artista || ''} ${item.titulo || ''}`.normalize('NFC').toLowerCase();
      accentedWords.forEach((word) => {
        if (originalText.includes(word)) score += 25;
      });
    }

    return score;
  };
}
