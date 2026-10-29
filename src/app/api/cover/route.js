import fs from 'fs';
import path from 'path';
import { isValidCategory } from '@/services/catalogService';
import { findCover } from '@/services/coverService';
import { normalizeText } from '@/utils/coverMatch';

// Esta rota só LÊ capas: não grava nada no banco. A capa_url de cada item só é
// preenchida pelo script scripts/auditar-capas.mjs, depois de revisão manual.

// v2: chaves geradas pelo algoritmo com conferência de artista/título. O cache antigo
// (src/data/covers_cache.json) foi gerado sem conferência e não é mais lido.
const CACHE_FILE = path.resolve(process.cwd(), '.cache/covers_cache_v2.json');
const CACHE_MAX_ENTRIES = 5000;
const NEGATIVE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_PARAM_LENGTH = 200;
const PODE_GRAVAR_DISCO = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

const cache = new Map();
const emAndamento = new Map();

try {
  if (PODE_GRAVAR_DISCO && fs.existsSync(CACHE_FILE)) {
    const salvo = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    for (const [k, v] of Object.entries(salvo)) cache.set(k, v);
  }
} catch (err) {
  console.warn('Cache de capas ignorado:', err.message);
}

function lerCache(key) {
  const entrada = cache.get(key);
  if (!entrada) return undefined;
  if (!entrada.cover && Date.now() - (entrada.em || 0) > NEGATIVE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entrada;
}

function gravarCache(key, entrada) {
  cache.delete(key);
  cache.set(key, entrada);
  while (cache.size > CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  if (entrada.cover) agendarGravacaoEmDisco();
}

let timerDisco = null;
function agendarGravacaoEmDisco() {
  if (!PODE_GRAVAR_DISCO) return;
  clearTimeout(timerDisco);
  timerDisco = setTimeout(async () => {
    try {
      const positivos = Object.fromEntries([...cache].filter(([, v]) => v.cover));
      await fs.promises.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await fs.promises.writeFile(CACHE_FILE, JSON.stringify(positivos, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Falha ao salvar cache de capas:', err.message);
    }
  }, 2000);
}

const SEM_CAPA = { cover: null, thumb: null };

function param(searchParams, nome) {
  return (searchParams.get(nome) || '').trim().slice(0, MAX_PARAM_LENGTH);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoria = param(searchParams, 'categoria') || 'discos';
  const artista = param(searchParams, 'artista');
  const titulo = param(searchParams, 'titulo');
  const anoBruto = param(searchParams, 'ano');
  const ano = /^\d{4}$/.test(anoBruto) ? anoBruto : '';

  if (!isValidCategory(categoria) || categoria === 'dvds' || categoria === 'vhs' || !titulo) {
    return Response.json(SEM_CAPA);
  }

  const key = ['v2', categoria, normalizeText(artista), normalizeText(titulo), ano].join('|');

  const emCache = lerCache(key);
  if (emCache) {
    return Response.json(emCache.cover ? emCache : SEM_CAPA, {
      headers: {
        'Cache-Control': emCache.cover
          ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
          : 'public, max-age=600',
        'X-Cache': 'HIT',
      },
    });
  }

  if (!emAndamento.has(key)) {
    const busca = findCover({ artista, titulo, ano }, categoria)
      .then((encontrada) => {
        const entrada = encontrada ? { ...encontrada, em: Date.now() } : { cover: null, em: Date.now() };
        gravarCache(key, entrada);
        return entrada;
      })
      .catch((err) => {
        console.error('Erro ao buscar capa:', err);
        return null;
      })
      .finally(() => emAndamento.delete(key));
    emAndamento.set(key, busca);
  }

  const entrada = await emAndamento.get(key);
  if (!entrada?.cover) {
    return Response.json(SEM_CAPA, {
      headers: { 'Cache-Control': entrada ? 'public, max-age=600' : 'no-store', 'X-Cache': 'MISS' },
    });
  }

  return Response.json(entrada, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'X-Cache': 'MISS',
    },
  });
}
