// Gera src/data/destaques-lojas.json: os discos mais famosos de cada loja, medidos no Deezer.
//
// 1. Busca no Deezer quantos fãs tem cada artista com disco (com capa) no estoque.
//    O país de cada artista vem do MusicBrainz;
//    a página alterna estrangeiro e brasileiro.
// 2. Para os artistas mais seguidos de cada loja, procura cada disco como álbum no Deezer
//    e escolhe o álbum com mais fãs.
// 3. Grava uma lista ordenada de candidatos por loja. A página /lojas lê esse arquivo e
//    mostra os 5 primeiros que ainda estão no estoque (não consulta o Deezer a cada visita).
//
// Uso (na pasta do projeto): node --env-file=.env.local scripts/ranking-destaques.mjs
// Primeira vez: uns 20 minutos (Deezer e MusicBrainz). Depois, com o cache em scripts/.cache/,
// só os artistas novos são consultados.

import { createRequire } from 'module';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';

const require = createRequire(process.cwd() + '/package.json');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const ARTISTAS_POR_LOJA = 15; // por grupo (brasileiros e estrangeiros), com sobra para vendas
const DISCOS_POR_ARTISTA = 5; // quantos discos do artista comparar como álbum
const LIMITE_CONSULTA_PAIS = 400; // artistas mais seguidos consultados no MusicBrainz por loja
const CACHE = 'scripts/.cache/artistas.json'; // fãs e país já consultados
const INTERVALO_MS = 120; // ~8 consultas por segundo, abaixo do limite do Deezer

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function deezer(caminho) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    await pausa(INTERVALO_MS);
    try {
      const res = await fetch(`https://api.deezer.com${caminho}`);
      const json = await res.json();
      if (json?.error?.code === 4) { await pausa(5000); continue; } // limite de consultas
      return json;
    } catch {
      await pausa(1000);
    }
  }
  return null;
}

async function fasDoArtista(nome) {
  const json = await deezer(`/search/artist?q=${encodeURIComponent(nome)}&limit=5`);
  const alvo = norm(nome);
  const iguais = (json?.data || []).filter((a) => norm(a.name) === alvo);
  return iguais.reduce((max, a) => Math.max(max, a.nb_fan || 0), 0);
}

async function fasDoAlbum(artista, titulo) {
  const json = await deezer(`/search/album?q=${encodeURIComponent(`${artista} ${titulo}`)}&limit=5`);
  const alvoArtista = norm(artista);
  const alvoTitulo = norm(titulo);
  const achado = (json?.data || []).find(
    (a) => norm(a.artist?.name) === alvoArtista && (norm(a.title).includes(alvoTitulo) || alvoTitulo.includes(norm(a.title)))
  );
  if (!achado) return 0;
  const album = await deezer(`/album/${achado.id}`);
  return album?.fans || 0;
}

// 1. Discos com capa no estoque
let discos = [];
for (let inicio = 0; ; inicio += 1000) {
  const { data, error } = await sb
    .from('discos')
    .select('id, artista, titulo, loja, preco')
    .eq('ativo', true)
    .eq('deletado', false)
    .not('capa_url', 'is', null)
    .range(inicio, inicio + 999);
  if (error) throw error;
  discos = discos.concat(data);
  if (data.length < 1000) break;
}
discos = discos.filter((d) => d.loja && d.artista && norm(d.artista) && !/^(varios|various|coletanea)/.test(norm(d.artista)));
console.log(`${discos.length} discos com capa`);

// 2. Fãs de cada artista (guardados em cache para a próxima rodada ser rápida)
const nomes = new Map(); // chave normalizada -> nome como está no estoque
for (const d of discos) if (!nomes.has(norm(d.artista))) nomes.set(norm(d.artista), d.artista.trim());
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
cache.pais ||= {};
const fas = new Map(Object.entries(cache.fas || {}));
let feitos = 0;
for (const [chave, nome] of nomes) {
  if (!fas.has(chave)) fas.set(chave, await fasDoArtista(nome));
  if (++feitos % 250 === 0) {
    console.log(`artistas: ${feitos}/${nomes.size}`);
    salvarCache();
  }
}
salvarCache();

function salvarCache() {
  mkdirSync('scripts/.cache', { recursive: true });
  writeFileSync(CACHE, JSON.stringify({ fas: Object.fromEntries(fas), pais: cache.pais }));
}

// País do artista no MusicBrainz (o Deezer não informa). Uma consulta por segundo, como
// pede a API; o resultado fica no cache.
async function ehBrasileiro(chave) {
  if (!(chave in cache.pais)) {
    await pausa(1100);
    let pais = '';
    try {
      const busca = encodeURIComponent(`artist:"${nomes.get(chave)}"`);
      const res = await fetch(`https://musicbrainz.org/ws/2/artist?query=${busca}&fmt=json&limit=5`, {
        headers: { 'User-Agent': 'FreelancerDiscosVitrine/1.0 (script de ranking)' },
      });
      const json = await res.json();
      const achado = (json.artists || [])
        .filter((x) => norm(x.name) === chave && x.score >= 90)
        .sort((x, y) => y.score - x.score)[0];
      pais = achado?.country || (achado?.area?.name === 'Brazil' ? 'BR' : '');
    } catch {
      pais = '';
    }
    cache.pais[chave] = pais;
  }
  return cache.pais[chave] === 'BR';
}

// 3. Por loja: os mais seguidos, separados em brasileiros e estrangeiros, e de cada
//    artista o álbum com mais fãs. A página alterna estrangeiro e brasileiro.
const lojas = {};
for (const loja of [...new Set(discos.map((d) => d.loja))].sort()) {
  const daLoja = discos.filter((d) => d.loja === loja);
  const porFama = [...new Set(daLoja.map((d) => norm(d.artista)))]
    .filter((a) => fas.get(a) > 0)
    .sort((a, b) => fas.get(b) - fas.get(a));

  const escolhidos = [];
  let br = 0;
  let fora = 0;
  for (const chave of porFama.slice(0, LIMITE_CONSULTA_PAIS)) {
    if (br >= ARTISTAS_POR_LOJA && fora >= ARTISTAS_POR_LOJA) break;
    const brasileiro = await ehBrasileiro(chave);
    if (brasileiro && br < ARTISTAS_POR_LOJA) { escolhidos.push({ chave, brasileiro }); br++; }
    if (!brasileiro && fora < ARTISTAS_POR_LOJA) { escolhidos.push({ chave, brasileiro }); fora++; }
  }
  salvarCache();

  lojas[loja] = [];
  for (const { chave, brasileiro } of escolhidos) {
    const doArtista = daLoja
      .filter((d) => norm(d.artista) === chave)
      .sort((a, b) => Number(b.preco) - Number(a.preco))
      .slice(0, DISCOS_POR_ARTISTA);
    let melhor = null;
    for (const d of doArtista) {
      const fasAlbum = await fasDoAlbum(d.artista, d.titulo);
      if (!melhor || fasAlbum > melhor.fasAlbum) melhor = { ...d, fasAlbum };
    }
    // Os outros discos do artista ficam como reserva, caso o escolhido saia do estoque.
    lojas[loja].push({
      artista: melhor.artista,
      brasileiro,
      fasArtista: fas.get(chave),
      ids: [melhor.id, ...doArtista.filter((d) => d.id !== melhor.id).map((d) => d.id)],
      escolhido: melhor.titulo,
      fasAlbum: melhor.fasAlbum,
    });
    console.log(`${loja}: ${brasileiro ? '[BR] ' : ''}${melhor.artista} (${fas.get(chave)} fãs) — ${melhor.titulo} (${melhor.fasAlbum} fãs)`);
  }
}

mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/destaques-lojas.json',
  JSON.stringify({ fonte: 'Deezer (fãs do artista e do álbum)', geradoEm: new Date().toISOString(), lojas }, null, 2) + '\n'
);
console.log('gravado em src/data/destaques-lojas.json');
