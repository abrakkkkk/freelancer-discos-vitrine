// Confere se uma capa encontrada (Discogs/iTunes) corresponde ao disco do acervo.
// Regra de ouro: na dúvida, rejeita. Sem capa (ícone) é melhor que capa errada.

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'de', 'do', 'da', 'dos', 'das', 'ao', 'aos', 'para', 'por',
  'el', 'la', 'los', 'las', 'del', 'y', 'le', 'les', 'des', 'du', 'et',
  'feat', 'ft', 'featuring', 'vs', 'lp', 'vol', 'volume',
]);

// Palavras que indicam outro produto (coletânea, ao vivo, single, karaokê...).
// Se aparecem no candidato e não no item, o candidato é rejeitado.
const PALAVRAS_OUTRO_PRODUTO = new Set([
  'best', 'very', 'greatest', 'hits', 'collection', 'essential', 'complete',
  'anthology', 'antologia', 'grandes', 'sucessos', 'coletanea', 'colecao',
  'single', 'ep', 'remix', 'remixes', 'karaoke', 'tribute', 'tributo', 'revival',
  'anniversary', 'deluxe', 'live', 'vivo', 'acustico', 'unplugged', 'instrumental',
]);

const ROMANOS = {
  ii: '2', iii: '3', iv: '4', vi: '6', vii: '7', viii: '8', ix: '9',
  xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16', xvii: '17',
  xviii: '18', xix: '19', xx: '20',
};

// Número por extenso equivale ao algarismo ("Woody Three" = "Woody III").
const NUMEROS_POR_EXTENSO = {
  two: '2', three: '3', four: '4', five: '5',
  dois: '2', tres: '3', quatro: '4', cinco: '5',
};

// Artista com estas palavras é outro produto. "revival" fica de fora: Creedence Clearwater
// Revival é o nome da banda, e cover como "Beatles Revival Band" cai na checagem do título.
const ARTISTA_OUTRO_PRODUTO = new Set(['karaoke', 'tribute', 'tributo']);

const RE_VARIOUS = /^(v[aá]rios(\s+artistas)?|various(\s+artists)?|trilha\s+sonora.*|colet[aâ]nea|diversos)$/i;

const RE_TRILHA = /trilha\s+sonora(\s+original)?(\s+d[ao]\s+(novela|filme|minis+[eé]rie|s[eé]rie))?/gi;

// Parênteses/colchetes com anotações de edição ou de loja: não identificam o álbum.
const RE_PARENTESE_RUIDO =
  /[([][^)\]]*\b(remaster(ed)?|deluxe|edition|edi[cç][aã]o|version|vers[aã]o|bonus|expanded|mono|stereo|imp|importado|lacrado|reissue|reedi[cç][aã]o)\b[^)\]]*[)\]]/gi;

export function normalizeText(texto) {
  if (!texto) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[º°ª]/g, '')
    .replace(/['’`´]/g, '')
    .replace(/\b([a-z])\.(?=[a-z]\b)/g, '$1') // U.S.A. -> usa.
    // Mantém letras de qualquer alfabeto e seus acentos combinantes (japonês, por exemplo).
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isVariousArtist(artista) {
  const a = String(artista || '').trim();
  return !a || RE_VARIOUS.test(a);
}

export function cleanTitle(titulo) {
  return String(titulo || '')
    .replace(RE_PARENTESE_RUIDO, ' ')
    .replace(RE_TRILHA, ' ');
}

export function tokenize(texto) {
  return normalizeText(texto)
    .split(' ')
    .map((t) => {
      if (ROMANOS[t]) return ROMANOS[t];
      if (NUMEROS_POR_EXTENSO[t]) return NUMEROS_POR_EXTENSO[t];
      const ordinal = t.match(/^(\d+)(st|nd|rd|th|o|a)$/);
      return ordinal ? ordinal[1] : t;
    })
    .filter((t) => t && !STOP_WORDS.has(t) && (t.length > 1 || /^\d$/.test(t)));
}

// Nomes feitos só de palavras curtas ("Y & T", "Vol. I") sumiriam na tokenização:
// nesse caso a comparação usa todas as palavras.
function tokenizeComReserva(texto) {
  const tokens = tokenize(texto);
  if (tokens.length > 0) return tokens;
  const todos = normalizeText(texto);
  return todos ? todos.split(' ') : [];
}

function editDistanceAtMostOne(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// Igualdade tolerante a um erro de digitação (Creusa/Creuza), só em palavras longas
// e nunca em números (Vol. 3 ≠ Vol. 4).
function tokensEquivalentes(a, b) {
  if (a === b) return true;
  if (/\d/.test(a) || /\d/.test(b)) return false;
  return a.length >= 5 && b.length >= 5 && editDistanceAtMostOne(a, b);
}

// Fração dos tokens de `origem` encontrados em `alvo`.
function cobertura(origem, alvo) {
  const unicos = [...new Set(origem)];
  if (unicos.length === 0) return 0;
  const achados = unicos.filter((t) => alvo.some((u) => tokensEquivalentes(t, u)));
  return achados.length / unicos.length;
}

const isAno = (t) => /^(19|20)\d{2}$/.test(t);
const numerosNaoAno = (tokens) => new Set(tokens.filter((t) => /^\d+$/.test(t) && !isAno(t)));

function mesmosNumeros(a, b) {
  const na = numerosNaoAno(a);
  const nb = numerosNaoAno(b);
  return na.size === nb.size && [...na].every((n) => nb.has(n));
}

function semTokensDoArtista(tituloTokens, artistaTokens) {
  const resto = tituloTokens.filter((t) => !artistaTokens.includes(t));
  return resto.length > 0 ? resto : tituloTokens;
}

function anoNumero(ano) {
  const m = String(ano || '').match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

// Artista e título trocados de campo ou juntos num só ("Os Impossíveis e Os San-Papas -
// Os Sucessos do Momento" x "San-Papas - Os Impossiveis E Os Sucessos Do Momento"):
// se o conjunto de palavras é o mesmo, é o mesmo disco.
function mesmasPalavrasNoTotal(item, candidato, itemVarios, candVarios) {
  const itemArtista = itemVarios ? [] : tokenizeComReserva(item.artista);
  const candArtista = candVarios ? [] : tokenizeComReserva(candidato.artista);
  const itemTitulo = tokenizeComReserva(cleanTitle(item.titulo));
  const candTitulo = tokenizeComReserva(cleanTitle(candidato.titulo));
  if (itemTitulo.length === 0 || candTitulo.length === 0) return false;

  // Homônimo depende do ano: é tratado na regra normal.
  if (itemArtista.length > 0 && itemTitulo.every((t) => itemArtista.includes(t)) && !candVarios) return false;

  const itemTodos = [...itemArtista, ...itemTitulo];
  const candTodos = [...candArtista, ...candTitulo];
  if (new Set(itemTodos).size < 2 || new Set(candTodos).size < 2) return false;
  if (!mesmosNumeros(itemTodos, candTodos)) return false;
  if (candTodos.some((t) => PALAVRAS_OUTRO_PRODUTO.has(t) && !itemTodos.includes(t))) return false;
  return cobertura(itemTodos, candTodos) >= 0.9 && cobertura(candTodos, itemTodos) >= 0.9;
}

/**
 * Compara um item do acervo com uma capa candidata.
 * @param {{artista?: string, titulo: string, ano?: string|number}} item
 * @param {{artista?: string, titulo: string, ano?: string|number}} candidato
 * @returns {{aceito: boolean, score: number, motivo: string}}
 */
export function scoreCandidate(item, candidato) {
  const rejeita = (motivo) => ({ aceito: false, score: 0, motivo });

  const itemVarios = isVariousArtist(item.artista);
  const candVarios = isVariousArtist(candidato.artista);
  if (mesmasPalavrasNoTotal(item, candidato, itemVarios, candVarios)) {
    const anoItem = anoNumero(item.ano);
    const mesmoAno = anoItem && anoItem === anoNumero(candidato.ano);
    return { aceito: true, score: mesmoAno ? 1.1 : 1, motivo: 'ok' };
  }
  if (itemVarios !== candVarios) return rejeita('artista_various_divergente');

  const itemArtista = itemVarios ? [] : tokenizeComReserva(item.artista);
  const candArtista = candVarios ? [] : tokenizeComReserva(candidato.artista);

  let scoreArtista = 1;
  if (!itemVarios) {
    if (itemArtista.length === 0 || candArtista.length === 0) return rejeita('artista_vazio');
    scoreArtista = cobertura(itemArtista, candArtista);
    // Cadastro mais longo que o nome do artista ("Benedito Costa E Seu Cavaquinho" x "Benedito Costa").
    if (candArtista.length >= 2) scoreArtista = Math.max(scoreArtista, cobertura(candArtista, itemArtista));
    if (scoreArtista < 0.8) return rejeita('artista_diferente');
    if (candArtista.some((t) => ARTISTA_OUTRO_PRODUTO.has(t) && !itemArtista.includes(t))) {
      return rejeita('artista_outro_produto');
    }
  }

  const itemTituloBruto = tokenizeComReserva(cleanTitle(item.titulo));
  const candTituloBruto = tokenizeComReserva(cleanTitle(candidato.titulo));
  if (itemTituloBruto.length === 0 || candTituloBruto.length === 0) return rejeita('titulo_vazio');

  const itemTitulo = semTokensDoArtista(itemTituloBruto, itemArtista);
  const candTitulo = semTokensDoArtista(candTituloBruto, candArtista);

  if (!mesmosNumeros(itemTituloBruto, candTituloBruto)) return rejeita('numero_volume_divergente');

  const temNacional = (ts) => ts.includes('nacional');
  const temInternacional = (ts) => ts.includes('internacional');
  if (
    (temNacional(itemTituloBruto) && temInternacional(candTituloBruto)) ||
    (temInternacional(itemTituloBruto) && temNacional(candTituloBruto))
  ) {
    return rejeita('nacional_internacional_divergente');
  }

  if (candTituloBruto.some((t) => PALAVRAS_OUTRO_PRODUTO.has(t) && !itemTituloBruto.includes(t))) {
    return rejeita('titulo_outro_produto');
  }

  const recall = cobertura(itemTitulo, candTitulo);
  const precisao = cobertura(candTitulo, itemTitulo);
  // Coletâneas/trilhas só têm o título para identificar: exige correspondência quase total.
  const precisaoMinima = itemVarios ? 0.8 : 0.5;
  if (recall < 0.8 || precisao < precisaoMinima) return rejeita('titulo_diferente');

  // Disco homônimo (título = artista): artistas como Roberto Carlos lançaram um por ano,
  // então só o ano exato diferencia os álbuns.
  const homonimo = itemTitulo.every((t) => itemArtista.includes(t)) && itemArtista.length > 0;
  const itemAno = anoNumero(item.ano);
  const candAno = anoNumero(candidato.ano);
  if (homonimo && (!itemAno || !candAno)) return rejeita('homonimo_sem_ano');
  if (homonimo && itemAno !== candAno) return rejeita('homonimo_ano_divergente');

  let score = (scoreArtista + (recall + precisao) / 2) / 2;
  if (itemAno && candAno && itemAno === candAno) score += 0.1;
  return { aceito: true, score: Math.round(score * 1000) / 1000, motivo: 'ok' };
}

/** Separa o "Artista - Título" que o Discogs devolve na busca e em /releases. */
export function parseDiscogsTitle(title) {
  const texto = String(title || '');
  const idx = texto.indexOf(' - ');
  if (idx < 0) return { artista: '', titulo: texto.trim() };
  return {
    artista: limparNomeArtistaDiscogs(texto.slice(0, idx)),
    titulo: texto.slice(idx + 3).trim(),
  };
}

/** Remove os sufixos de desambiguação do Discogs: "Elizabeth (3)", "Caetano*". */
export function limparNomeArtistaDiscogs(nome) {
  return String(nome || '')
    .replace(/\s*\(\d+\)/g, '')
    .replace(/\*/g, '')
    .trim();
}

/**
 * Extrai o tipo e o id do release/master a partir da URL de imagem do Discogs.
 * O caminho original (ex.: R-1307584-...jpeg) vem codificado em base64 no fim da URL.
 */
export function discogsRefFromImageUrl(url) {
  if (!url || !String(url).includes('discogs.com')) return null;
  const partes = String(url).split('/');
  const inicio = partes.findIndex((p) => p.startsWith('czM6'));
  if (inicio < 0) return null;
  const b64 = partes
    .slice(inicio)
    .join('')
    .replace(/\.(jpe?g|png|gif|webp)$/i, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  let decodificado = '';
  try {
    decodificado =
      typeof Buffer !== 'undefined'
        ? Buffer.from(b64, 'base64').toString('utf-8')
        : atob(b64);
  } catch {
    return null;
  }
  const m = decodificado.match(/\/([RAM])-(\d+)/);
  if (!m || m[1] === 'A') return null;
  return { tipo: m[1] === 'M' ? 'master' : 'release', id: m[2] };
}
