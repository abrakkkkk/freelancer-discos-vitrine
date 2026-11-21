// Busca da lista de faixas no Discogs, usada pelo script de preenchimento e pela vitrine
// quando o estoque avisa que um disco foi cadastrado ou editado.
import { discogsRefFromImageUrl, isVariousArtist, cleanTitle, parseDiscogsTitle, scoreCandidate, limparNomeArtistaDiscogs } from './coverMatch.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function headersDiscogs(env = process.env) {
  if (!env.DISCOGS_KEY || !env.DISCOGS_SECRET) return null;
  return {
    Authorization: `Discogs key=${env.DISCOGS_KEY}, secret=${env.DISCOGS_SECRET}`,
    'User-Agent': 'FreelancerDiscosVitrine/1.0',
  };
}

// Respeita o limite do Discogs (60 consultas por minuto) e tenta de novo quando ele recusa.
export async function consultar(url, headers, tentativas = 5) {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000), cache: 'no-store' }).catch(() => null);
    if (res?.ok) {
      const restante = Number(res.headers.get('x-discogs-ratelimit-remaining'));
      if (Number.isFinite(restante) && restante < 5) await sleep(3000);
      return res.json();
    }
    if (res && res.status === 404) return null;
    if (tentativa < tentativas) await sleep(res?.status === 429 ? 30000 : 5000 * tentativa);
  }
  throw new Error('Discogs não respondeu.');
}

// LP que vem com CD de brinde: o Discogs lista as duas mídias ("LP-A1", "CDr-1", "CD-1").
// Fica só o disco, sem o prefixo.
export function soPrimeiraMidia(faixas) {
  const midia = (p) => p.match(/^([A-Za-z]+)-(.+)$/);
  const comPrefixo = faixas.filter((f) => midia(f.posicao));
  if (!comPrefixo.length) return faixas;
  // Vinil com lados normais (A1, B1) e o CD à parte: sai o CD.
  if (comPrefixo.length < faixas.length) return faixas.filter((f) => !midia(f.posicao));
  const primeira = midia(faixas[0].posicao)[1];
  return faixas
    .filter((f) => midia(f.posicao)[1] === primeira)
    .map((f) => ({ ...f, posicao: midia(f.posicao)[2] }));
}

export function faixasDoLancamento(dados) {
  // Faixas agrupadas (suíte, medley) vêm como "index" com as partes em sub_tracks.
  const faixas = (dados?.tracklist || [])
    .flatMap((f) => (f.type_ === 'index' && f.sub_tracks?.length ? f.sub_tracks : [f]))
    .filter((f) => (f.type_ || 'track') === 'track' && f.title)
    .map((f) => ({ posicao: f.position || '', titulo: f.title.trim(), duracao: f.duration || '' }));
  return soPrimeiraMidia(faixas);
}

/** Gêneros e estilos do lançamento, como o Discogs devolve. */
export function generosDoLancamento(dados) {
  return { genres: dados?.genres || [], styles: dados?.styles || [] };
}

async function porCapa(item, headers, tentativas) {
  const ref = discogsRefFromImageUrl(item.capa_url);
  if (!ref) return null;
  const tipo = ref.tipo === 'master' ? 'masters' : 'releases';
  const dados = await consultar(`https://api.discogs.com/${tipo}/${ref.id}`, headers, tentativas);
  const faixas = faixasDoLancamento(dados);
  return faixas.length
    ? { faixas, fonte: `https://www.discogs.com/${ref.tipo}/${ref.id}`, origem: 'capa', generos: generosDoLancamento(dados) }
    : null;
}

async function porBusca(item, headers, tentativas) {
  if (!item.titulo) return null;
  const artista = isVariousArtist(item.artista) ? 'Various' : item.artista || '';
  const titulo = cleanTitle(item.titulo).replace(/\s+/g, ' ').trim();
  const params = new URLSearchParams({ type: 'release', per_page: '15', artist: artista, release_title: titulo, format: 'Vinyl' });
  const busca = await consultar(`https://api.discogs.com/database/search?${params}`, headers, tentativas);

  let melhor = null;
  for (const r of busca?.results || []) {
    const nota = scoreCandidate(item, { ...parseDiscogsTitle(r.title), ano: r.year || '' });
    if (!nota.aceito) continue;
    // Disco com o mesmo nome da música de trabalho: o LP vale mais que o compacto.
    const formato = (r.format || []).join(' ');
    const peso = /\b(LP|Album)\b/.test(formato) ? 0.05 : /Single|7"|EP\b/.test(formato) ? -0.3 : 0;
    const score = nota.score + peso + (r.country === 'Brazil' ? 0.02 : 0);
    if (!melhor || score > melhor.score) melhor = { id: r.id, score };
  }
  if (!melhor) return null;

  const dados = await consultar(`https://api.discogs.com/releases/${melhor.id}`, headers, tentativas);
  const faixas = faixasDoLancamento(dados);
  return faixas.length
    ? { faixas, fonte: `https://www.discogs.com/release/${melhor.id}`, origem: 'busca', generos: generosDoLancamento(dados) }
    : null;
}

/**
 * Lista de faixas de um disco: pela capa do Discogs e, se não der, por artista e título.
 * Volta null quando não acha; lança erro quando o Discogs não responde.
 */
export async function buscarFaixasDoDisco(item, { headers, tentativas = 5 }) {
  return (await porCapa(item, headers, tentativas)) || (await porBusca(item, headers, tentativas));
}

/** Valor gravado em discos.faixas. {faixas: []} marca disco procurado e não encontrado. */
export function valorParaGravar(resultado, hoje = new Date().toISOString().slice(0, 10)) {
  return resultado ? { faixas: resultado.faixas, fonte: resultado.fonte, em: hoje } : { faixas: [], em: hoje };
}

// Lançamento de onde vêm os gêneros. Para o gênero serve qualquer edição (LP, CD, master):
// o que importa é ser o mesmo disco. Ordem: a fonte das faixas já conferida, a capa, a busca.
const REF_FONTE = /discogs\.com\/(release|master)\/(\d+)/;

async function lancamentoPelaRef(ref, headers, tentativas) {
  const tipo = ref.tipo === 'master' ? 'masters' : 'releases';
  const dados = await consultar(`https://api.discogs.com/${tipo}/${ref.id}`, headers, tentativas);
  return dados ? { dados, fonte: `https://www.discogs.com/${ref.tipo}/${ref.id}` } : null;
}

/**
 * Lançamento do Discogs para tirar os gêneros de um disco, ou null.
 * Lança erro quando o Discogs não responde.
 */
export async function buscarLancamentoParaGenero(item, { headers, tentativas = 5 }) {
  const fonte = item.faixas?.fonte?.match(REF_FONTE);
  if (fonte) {
    const r = await lancamentoPelaRef({ tipo: fonte[1], id: fonte[2] }, headers, tentativas);
    if (r) return { ...r, origem: 'faixas' };
  }

  const ref = discogsRefFromImageUrl(item.capa_url);
  if (ref) {
    const r = await lancamentoPelaRef(ref, headers, tentativas);
    const artista = limparNomeArtistaDiscogs((r?.dados?.artists || []).map((a) => a.name).join(' & '));
    if (r && scoreCandidate(item, { artista, titulo: r.dados.title || '', ano: r.dados.year || '' }).aceito) {
      return { ...r, origem: 'capa' };
    }
  }

  if (!item.titulo) return null;
  const artista = isVariousArtist(item.artista) ? 'Various' : item.artista || '';
  const titulo = cleanTitle(item.titulo).replace(/\s+/g, ' ').trim();
  const params = new URLSearchParams({ type: 'release', per_page: '15', artist: artista, release_title: titulo });
  const busca = await consultar(`https://api.discogs.com/database/search?${params}`, headers, tentativas);
  let melhor = null;
  for (const r of busca?.results || []) {
    const nota = scoreCandidate(item, { ...parseDiscogsTitle(r.title), ano: r.year || '' });
    if (!nota.aceito || !(r.genre || []).length) continue;
    if (!melhor || nota.score > melhor.score) melhor = { r, score: nota.score };
  }
  if (!melhor) return null;
  // A busca já traz gênero e estilo: não precisa de outra consulta.
  return {
    dados: { genres: melhor.r.genre || [], styles: melhor.r.style || [] },
    fonte: `https://www.discogs.com/release/${melhor.r.id}`,
    origem: 'busca',
  };
}

/** Valor gravado em discos.genero_discogs. Listas vazias marcam disco procurado e não encontrado. */
export function generoParaGravar(lancamento, hoje = new Date().toISOString().slice(0, 10)) {
  return lancamento
    ? { ...generosDoLancamento(lancamento.dados), fonte: lancamento.fonte, em: hoje }
    : { genres: [], styles: [], em: hoje };
}
