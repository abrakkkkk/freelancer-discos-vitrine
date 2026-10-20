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

export function extractSearchTokens(queryStr) {
  if (!queryStr) return { allWords: [], contentWords: [], effectiveWords: [] };

  const clean = removeAcentos(queryStr)
    .replace(/[-–—:()/\_\\*~!?[\]+"',.;&]/g, ' ')
    .trim();

  const allWords = clean.split(/\s+/).filter(Boolean);
  const contentWords = allWords.filter(w => !MUSIC_STOP_WORDS.has(w) && w.length >= 2);
  const effectiveWords = contentWords.length > 0 ? contentWords : allWords;

  return {
    allWords,
    contentWords,
    effectiveWords,
  };
}

export function calculateItemRelevance(item, allWords = [], effectiveWords = [], isVideo = false) {
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
  effectiveWords.forEach(w => {
    if (fullText.includes(w)) {
      matchedEffective++;
      score += 30;
      if (!isVideo && itemArtista.includes(w)) score += 20;
      if (itemTitulo.includes(w)) score += 20;
    }
  });

  if (effectiveWords.length > 0 && matchedEffective === effectiveWords.length) {
    score += 50;
  }

  return score;
}
