import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';
import { isValidCategory } from '@/services/catalogService';

const PRIMARY_CACHE_FILE = path.resolve(process.cwd(), '.cache/covers_cache.json');
const LEGACY_CACHE_FILE = path.resolve(process.cwd(), 'src/data/covers_cache.json');

let initialCovers = {};
try {
  if (fs.existsSync(PRIMARY_CACHE_FILE)) {
    initialCovers = JSON.parse(fs.readFileSync(PRIMARY_CACHE_FILE, 'utf-8'));
  } else if (fs.existsSync(LEGACY_CACHE_FILE)) {
    initialCovers = JSON.parse(fs.readFileSync(LEGACY_CACHE_FILE, 'utf-8'));
  }
} catch (_) {}

const runtimeMemoryCache = new Map(Object.entries(initialCovers || {}));

function getFromCache(key) {
  return runtimeMemoryCache.get(key) || null;
}

let saveDebounceTimer = null;
let isSavingCache = false;

function scheduleSaveCache() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) return;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(async () => {
    if (isSavingCache) {
      scheduleSaveCache();
      return;
    }
    isSavingCache = true;
    try {
      const dir = path.dirname(PRIMARY_CACHE_FILE);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      const currentCacheObj = Object.fromEntries(runtimeMemoryCache);
      await fs.promises.writeFile(
        PRIMARY_CACHE_FILE,
        JSON.stringify(currentCacheObj, null, 2),
        'utf-8'
      );
    } catch (_) {
    } finally {
      isSavingCache = false;
    }
  }, 2000);
}

function setToCache(key, payload) {
  runtimeMemoryCache.set(key, payload);
  scheduleSaveCache();
}

async function persistCoverToSupabase(id, categoria, coverUrl) {
  if (!supabaseServer || !id || !coverUrl) return;
  const table = isValidCategory(categoria) ? categoria : 'discos';
  const numId = Number(id);
  if (!numId) return;
  try {
    await supabaseServer
      .from(table)
      .update({ capa_url: coverUrl })
      .eq('id', numId)
      .is('capa_url', null);
  } catch (_) {}
}

function normalizeSearchQuery(str) {
  if (!str) return '';
  return str
    .replace(/\b(v[aá]rios(\s+artistas)?|trilha\s+sonora(\s+original)?)\b/gi, 'Various')
    .trim();
}

async function searchDiscogsCover(rawQ, cleanAno, key, secret) {
  if (!key || !secret) return null;
  const normQ = normalizeSearchQuery(rawQ);
  const headers = {
    Authorization: `Discogs key=${key}, secret=${secret}`,
    'User-Agent': 'FreelancerDiscosVitrine/1.0',
  };

  let url = `https://api.discogs.com/database/search?type=release&per_page=5&q=${encodeURIComponent(normQ)}`;
  if (cleanAno) url += `&year=${encodeURIComponent(cleanAno)}`;

  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results.find((r) => r.cover_image || r.thumb) || data.results[0];
        if (item && (item.cover_image || item.thumb)) return item;
      }
    }
  } catch (_) {}

  if (cleanAno) {
    try {
      const fallbackUrl = `https://api.discogs.com/database/search?type=release&per_page=5&q=${encodeURIComponent(normQ)}`;
      const fallbackRes = await fetch(fallbackUrl, { headers });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          const item =
            fallbackData.results.find((r) => r.cover_image || r.thumb) ||
            fallbackData.results[0];
          if (item && (item.cover_image || item.thumb)) return item;
        }
      }
    } catch (_) {}
  }

  if (/^various\s+/i.test(normQ)) {
    const titleOnly = normQ.replace(/^various\s+/i, '').trim();
    const cleanTitle = titleOnly
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*-\s*(nacional|internacional|volume\s*\d+|vol\.?\s*\d+)/gi, '')
      .replace(/:.*$/, '')
      .trim();

    if (cleanTitle && cleanTitle.length >= 3) {
      try {
        const titleUrl = `https://api.discogs.com/database/search?type=release&per_page=5&country=Brazil&q=${encodeURIComponent(cleanTitle)}`;
        const titleRes = await fetch(titleUrl, { headers });
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          const match =
            titleData.results?.find(
              (r) =>
                r.title?.toLowerCase().includes('various') &&
                (r.cover_image || r.thumb)
            ) ||
            titleData.results?.find((r) => r.cover_image || r.thumb) ||
            titleData.results?.[0];
          if (match && (match.cover_image || match.thumb)) return match;
        }
      } catch (_) {}
    }
  }

  return null;
}

async function searchItunesCover(rawQ) {
  if (!rawQ) return null;
  const cleanQ = rawQ
    .replace(/\b(v[aá]rios(\s+artistas)?|various)\b/gi, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();
  if (!cleanQ) return null;

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&country=BR&media=music&entity=album&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.find((r) => r.artworkUrl100);
    if (!first?.artworkUrl100) return null;
    const highRes = first.artworkUrl100.replace(/100x100bb\.jpg$/i, '600x600bb.jpg');
    return {
      cover_image: highRes,
      thumb: highRes,
    };
  } catch (_) {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q') || '';
  const id = searchParams.get('id') || '';
  const categoria = searchParams.get('categoria') || 'discos';
  const ano = searchParams.get('ano') || searchParams.get('year') || '';
  const refresh = searchParams.get('refresh') === 'true';

  const q = normalizeSearchQuery(rawQ);
  const cleanAno = ano && String(ano) !== 'null' ? String(ano).trim() : '';
  const qFull = `${q} ${cleanAno}`.trim();
  const qKey = qFull.toLowerCase();
  const qSimpleKey = q.toLowerCase();
  const idKey = id ? String(id) : '';

  if (!refresh) {
    if (idKey) {
      const cachedById = getFromCache(idKey);
      if (cachedById && (cachedById.cover || cachedById.thumb)) {
        const imgUrl = cachedById.cover || cachedById.thumb;
        persistCoverToSupabase(idKey, categoria, imgUrl);
        return Response.json(cachedById, {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            'X-Cache': 'HIT-ID',
          },
        });
      }
    }

    const cachedByQ = getFromCache(qKey) || getFromCache(qSimpleKey);
    if (cachedByQ && (cachedByQ.cover || cachedByQ.thumb)) {
      const imgUrl = cachedByQ.cover || cachedByQ.thumb;
      if (idKey) {
        setToCache(idKey, { ...cachedByQ, q: qKey });
        persistCoverToSupabase(idKey, categoria, imgUrl);
      }
      return Response.json(cachedByQ, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          'X-Cache': 'HIT-Q',
        },
      });
    }
  }

  if (!q && !id) {
    return Response.json({ cover: null, thumb: null });
  }

  const key = process.env.DISCOGS_KEY;
  const secret = process.env.DISCOGS_SECRET;

  try {
    let result = await searchDiscogsCover(q, cleanAno, key, secret);
    if (!result) {
      result = await searchItunesCover(rawQ);
    }

    const thumb = result?.thumb || result?.cover_image || null;
    const cover = result?.cover_image || thumb || null;

    const payload = { cover, thumb, q: qKey, ano: cleanAno };
    if (cover || thumb) {
      if (idKey) setToCache(idKey, payload);
      if (qKey) setToCache(qKey, payload);
      if (qSimpleKey) setToCache(qSimpleKey, payload);
      if (idKey) {
        await persistCoverToSupabase(idKey, categoria, cover || thumb);
      }
    }

    return Response.json(payload, {
      headers: {
        'Cache-Control':
          cover || thumb
            ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
            : 'no-cache, no-store',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('Cover fetch error:', err);
    return Response.json({ cover: null, thumb: null });
  }
}

