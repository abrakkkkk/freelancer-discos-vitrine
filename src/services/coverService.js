import 'server-only';
import { scoreCandidate, parseDiscogsTitle, isVariousArtist, cleanTitle } from '@/utils/coverMatch';

const FETCH_TIMEOUT_MS = 5000;

const FORMATO_DISCOGS = {
  discos: 'Vinyl',
  cds: 'CD',
};

function isImagemValida(url) {
  return Boolean(url) && !/spacer\.gif/i.test(url);
}

let discogsRestante = null;

// Buscas que o Discogs ainda permite no minuto, conforme a última resposta dele.
export function getDiscogsRestante() {
  return discogsRestante;
}

// Lança erro quando a busca não se completa (limite, timeout, fora do ar): isso é diferente
// de "não tem capa" e não pode ser tratado nem guardado como tal.
async function fetchJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const restante = res.headers.get('x-discogs-ratelimit-remaining');
  if (restante !== null) discogsRestante = Number(restante);
  if (!res.ok) throw new Error(`Busca de capa falhou: HTTP ${res.status}`);
  return res.json();
}

function escolherMelhor(item, candidatos) {
  let melhor = null;
  for (const cand of candidatos) {
    const r = scoreCandidate(item, cand);
    if (!r.aceito) continue;
    const score = r.score + (cand.bonus || 0);
    if (!melhor || score > melhor.score) melhor = { ...cand, score };
  }
  return melhor;
}

function candidatosDiscogs(results) {
  return (results || [])
    .filter((r) => isImagemValida(r.cover_image) || isImagemValida(r.thumb))
    .map((r) => {
      const { artista, titulo } = parseDiscogsTitle(r.title);
      return {
        artista,
        titulo,
        ano: r.year || '',
        cover: isImagemValida(r.cover_image) ? r.cover_image : r.thumb,
        thumb: isImagemValida(r.thumb) ? r.thumb : r.cover_image,
        origem: 'discogs',
        ref: r.id ? `${r.type === 'master' ? 'M' : 'R'}-${r.id}` : null,
        bonus: r.country === 'Brazil' ? 0.02 : 0,
      };
    });
}

async function buscarDiscogs(item, categoria) {
  const key = process.env.DISCOGS_KEY;
  const secret = process.env.DISCOGS_SECRET;
  if (!key || !secret) return null;

  const headers = {
    Authorization: `Discogs key=${key}, secret=${secret}`,
    'User-Agent': 'FreelancerDiscosVitrine/1.0',
  };
  const artista = isVariousArtist(item.artista) ? 'Various' : item.artista;
  const titulo = cleanTitle(item.titulo).replace(/\s+/g, ' ').trim();
  const formato = FORMATO_DISCOGS[categoria];

  // 1ª tentativa: campos estruturados no formato certo; 2ª: texto livre, sem formato.
  const tentativas = [
    new URLSearchParams({ type: 'release', per_page: '15', artist: artista, release_title: titulo, ...(formato ? { format: formato } : {}) }),
    new URLSearchParams({ type: 'release', per_page: '15', q: `${artista} ${titulo}` }),
  ];

  for (const params of tentativas) {
    const data = await fetchJson(`https://api.discogs.com/database/search?${params}`, headers);
    const melhor = escolherMelhor(item, candidatosDiscogs(data?.results));
    if (melhor) return melhor;
  }
  return null;
}

async function buscarItunes(item) {
  const termo = `${isVariousArtist(item.artista) ? '' : item.artista} ${cleanTitle(item.titulo)}`
    .replace(/\s+/g, ' ')
    .trim();
  if (!termo) return null;

  const params = new URLSearchParams({ term: termo, country: 'BR', media: 'music', entity: 'album', limit: '10' });
  const data = await fetchJson(`https://itunes.apple.com/search?${params}`);
  const candidatos = (data?.results || [])
    .filter((r) => r.artworkUrl100)
    .map((r) => {
      const capa = r.artworkUrl100.replace(/100x100bb\.jpg$/i, '600x600bb.jpg');
      return {
        artista: r.artistName || '',
        titulo: r.collectionName || '',
        ano: (r.releaseDate || '').slice(0, 4),
        cover: capa,
        thumb: capa,
        origem: 'itunes',
        ref: r.collectionId ? `itunes-${r.collectionId}` : null,
      };
    });
  return escolherMelhor(item, candidatos);
}

/**
 * Procura a capa de um item do acervo. Só devolve uma capa que passou na conferência
 * de artista, título, volume e ano (ver scoreCandidate); senão devolve null.
 */
export async function findCover(item, categoria) {
  if (!item?.titulo) return null;
  const encontrada = (await buscarDiscogs(item, categoria)) || (await buscarItunes(item));
  if (!encontrada) return null;
  const { cover, thumb, origem, ref, score, artista, titulo } = encontrada;
  return { cover, thumb, origem, ref, score: Math.round(score * 1000) / 1000, match: `${artista} - ${titulo}` };
}
