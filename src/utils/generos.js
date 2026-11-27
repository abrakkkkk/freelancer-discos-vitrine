// Gêneros da loja: a lista que o cliente vê, e a tradução dos gêneros e estilos do Discogs para ela.
// Um disco pode estar em mais de um gênero: o principal primeiro, depois os estilos claros do Discogs
// (um disco de sertanejo com forró aparece nos dois). O Discogs chama quase toda a música brasileira
// de "Latin"; o que separa samba, forró, sertanejo e os outros é o estilo.

const g = (id, nome, descricao) => ({ id, nome, descricao });

export const GENEROS = [
  g('mpb', 'MPB', 'A canção brasileira de autor que nasceu nos festivais dos anos 1960: Caetano, Gil, Chico, Milton, Elis e Gal.'),
  g('samba', 'Samba', 'O samba das rodas do Rio, o samba-canção, o partido-alto, os sambas-enredo e as marchinhas de carnaval.'),
  g('pagode', 'Pagode', 'O samba de fundo de quintal com banjo e tantã, de Fundo de Quintal, Zeca Pagodinho, Raça Negra e Só Pra Contrariar.'),
  g('choro', 'Choro', 'A música instrumental do bandolim, da flauta e do cavaquinho, de Pixinguinha, Jacob do Bandolim e Waldir Azevedo.'),
  g('bossa-nova', 'Bossa Nova', 'O samba de voz baixa e violão de João Gilberto, Tom Jobim, Vinicius de Moraes, Nara Leão e Astrud Gilberto.'),
  g('jovem-guarda', 'Jovem Guarda', 'O iê-iê-iê brasileiro dos anos 1960: Erasmo Carlos, Wanderley Cardoso, Jerry Adriani, Renato e Seus Blue Caps e Os Vips.'),
  g('rock-nacional', 'Rock Nacional', 'O rock feito no Brasil, da Jovem Guarda de Roberto e Erasmo aos anos 1980 de Titãs, Legião Urbana e Paralamas.'),
  g('rock-and-roll', 'Rock and Roll', 'O rock dos anos 1950 e começo dos 1960: Elvis, Chuck Berry, Little Richard, Bill Haley e o rockabilly.'),
  g('rock-progressivo', 'Rock Progressivo', 'O rock de suítes longas, teclados e orquestra: Yes, Genesis, Pink Floyd, Rick Wakeman e Jethro Tull.'),
  g('metal', 'Hard Rock e Metal', 'Guitarras pesadas, de Deep Purple, Uriah Heep e Black Sabbath ao Iron Maiden e ao thrash.'),
  g('rock', 'Rock', 'Do rock and roll dos anos 1950 ao progressivo, ao hard rock, ao punk e à new wave, de Elvis e Beatles ao Queen.'),
  g('pop', 'Pop', 'Os sucessos das paradas do mundo, de ABBA e Michael Jackson a Madonna, Rita Lee e Kid Abelha.'),
  g('romantica', 'Romântica', 'Boleros, serestas e baladas de amor, de Nelson Gonçalves, Angela Maria, Agnaldo Timóteo e Roberto Carlos.'),
  g('brega', 'Brega', 'O brega de Waldick Soriano, Odair José, Reginaldo Rossi, Amado Batista e do brega paraense.'),
  g('sertanejo', 'Sertanejo', 'A moda de viola caipira e as duplas sertanejas, de Tonico e Tinoco a Chitãozinho e Xororó.'),
  g('forro', 'Forró', 'O baião, o xote e o forró de Luiz Gonzaga, Jackson do Pandeiro, Dominguinhos e das bandas de forró.'),
  g('regional', 'Regional', 'Os ritmos de cada canto do Brasil: frevo, maracatu, bumba-meu-boi, repente, cantoria e música junina.'),
  g('axe', 'Axé', 'O carnaval da Bahia, de Luiz Caldas, Chiclete com Banana e Asa de Águia ao Olodum e à Banda Cheiro de Amor.'),
  g('carimbo', 'Carimbó', 'O ritmo do Pará, de Pinduca, Verequete, Mestre Lucindo e Dona Onete.'),
  g('lambada', 'Lambada', 'A lambada e a guitarrada do Norte, de Vieira e Seu Conjunto, Teixeira de Manaus e Mestre Solano.'),
  g('soul', 'Soul', 'A música negra americana dos anos 1960 e 1970, de Ray Charles, Aretha Franklin, Marvin Gaye e Tim Maia.'),
  g('funk-brasileiro', 'Funk Brasileiro', 'O funk feito no Brasil, da Banda Black Rio e do Black Rio dos anos 1970 ao funk carioca dos bailes.'),
  g('rap-nacional', 'Rap Nacional', 'O hip hop brasileiro, de Thaíde e DJ Hum e Racionais MCs a Sabotage, Emicida e Criolo.'),
  g('funk', 'Funk', 'O funk de James Brown, do Earth, Wind & Fire, do Parliament e de Prince.'),
  g('rap', 'Rap', 'O hip hop de fora, do Run DMC e Grandmaster Flash a LL Cool J e Public Enemy.'),
  g('disco', 'Disco', 'A música das pistas dos anos 1970, de Donna Summer, Bee Gees e Chic às Frenéticas.'),
  g('jazz', 'Jazz', 'Do swing das big bands ao bebop, ao cool e ao fusion, de Duke Ellington e Miles Davis a Ella Fitzgerald.'),
  g('blues', 'Blues', 'O blues de B.B. King, Muddy Waters, John Lee Hooker e Etta James.'),
  g('orquestras', 'Orquestras e Instrumental', 'Orquestras de baile e discos instrumentais: Ray Conniff, Mantovani, Paul Mauriat, Herb Alpert, Waldir Calmon e os discos de sax, órgão e teclado.'),
  g('eletronica', 'Eletrônica', 'Do synth-pop e da música de pista dos anos 1980 à house e ao techno.'),
  g('reggae', 'Reggae', 'O reggae da Jamaica de Bob Marley e Jimmy Cliff e o reggae brasileiro.'),
  g('folk', 'Folk', 'O folk do violão e da voz, de Bob Dylan, Joan Baez e Simon & Garfunkel à música celta.'),
  g('country', 'Country', 'A música do interior dos Estados Unidos, de Johnny Cash e Willie Nelson a Dolly Parton e Kenny Rogers.'),
  g('latina', 'Latina', 'A música da América Latina e da Espanha: tango, salsa, bolero, mariachi, merengue, música andina e flamenco.'),
  g('mundo', 'Música do Mundo', 'Fado, música africana, indiana, japonesa, havaiana, do Caribe francês e inglês, cigana e do Leste Europeu.'),
  g('afro-brasileira', 'Afro-brasileira', 'Os cantos de Umbanda e Candomblé, o afoxé e a música da capoeira.'),
  g('gospel', 'Gospel', 'Música cristã: hinos, corais, gospel americano e louvor brasileiro.'),
  g('classica', 'Clássica', 'Sinfonias, óperas, música de câmara e piano, de Bach, Mozart e Beethoven a Villa-Lobos.'),
  g('trilhas', 'Trilhas Sonoras', 'Trilhas de filmes, novelas e musicais.'),
  g('infantil', 'Infantil', 'Discos para crianças: cantigas de roda, histórias e os sucessos da TV.'),
  g('outros', 'Outros', 'O que não cabe nos outros gêneros: humor, poesia, discursos, bandas militares e coletâneas variadas.'),
];

const POR_ID = new Map(GENEROS.map((x) => [x.id, x]));

// Gêneros só de discos brasileiros e só de discos de fora. Os outros recebem os dois.
export const SO_BRASILEIROS = new Set([
  'mpb', 'samba', 'pagode', 'choro', 'bossa-nova', 'jovem-guarda', 'rock-nacional', 'romantica', 'brega', 'sertanejo',
  'forro', 'regional', 'axe', 'carimbo', 'lambada', 'afro-brasileira', 'funk-brasileiro', 'rap-nacional',
]);
export const SO_DE_FORA = new Set(['rock', 'rock-and-roll', 'funk', 'rap', 'country', 'folk', 'latina', 'mundo']);
// O mesmo gênero em versão de fora e brasileira.
const PARES = [['rock', 'rock-nacional'], ['funk', 'funk-brasileiro'], ['rap', 'rap-nacional'], ['country', 'sertanejo']];
const PARA_BRASIL = new Map(PARES);
const PARA_FORA = new Map(PARES.map(([a, b]) => [b, a]));

/** Ajusta o gênero à origem do disco: funk vira funk brasileiro e vice-versa; regional só no Brasil (null fora). */
export function generoNaOrigem(id, nacional) {
  if (nacional) return PARA_BRASIL.get(id) || id;
  if (id === 'regional') return null;
  return PARA_FORA.get(id) || id;
}

export const generoPorId = (id) => POR_ID.get(id) || null;
export const ehGeneroValido = (id) => POR_ID.has(id);

/** Gêneros gravados no disco que existem na lista, na ordem gravada. */
export function generosDoItem(item) {
  return (Array.isArray(item?.generos) ? item.generos : []).map(generoPorId).filter(Boolean);
}

// Peso dos estilos: o mais específico decide. 3 = ritmo bem definido, 2 = estilo claro, 1 = estilo amplo.
const ESTILOS = {};
const estilos = (peso, genero, lista) => lista.forEach((e) => (ESTILOS[e] = { genero, peso }));

estilos(3, 'pagode', ['Pagode']);
estilos(3, 'choro', ['Choro']);
estilos(3, 'jovem-guarda', ['Jovem Guarda']);
estilos(3, 'forro', ['Forró', 'Baião', 'Xote', 'Xaxado']);
estilos(3, 'sertanejo', ['Sertanejo', 'Caipira']);
estilos(3, 'regional', ['Frevo', 'Maracatu', 'Repente', 'Embolada', 'Coco', 'Ciranda', 'Bumba-meu-boi']);
estilos(3, 'axe', ['Axé']);
estilos(3, 'carimbo', ['Carimbó', 'Siriá']);
estilos(3, 'lambada', ['Lambada', 'Guitarrada']);
estilos(3, 'brega', ['Brega']);
estilos(3, 'funk-brasileiro', ['Favela Funk']);
estilos(3, 'gospel', ['Gospel']);
estilos(2, 'samba', ['Samba', 'Samba-Canção', 'Samba-Enredo', 'Samba Enredo', 'Partido Alto', 'Batucada', 'Marcha Carnavalesca']);
estilos(2, 'bossa-nova', ['Bossa Nova', 'Bossanova']);
estilos(2, 'mpb', ['Tropicalia', 'Tropicália']);
estilos(2, 'romantica', ['Seresta']);
estilos(2, 'rock-progressivo', ['Prog Rock', 'Symphonic Rock', 'Art Rock', 'Krautrock', 'Space Rock', 'Rock Opera']);
estilos(2, 'metal', [
  'Heavy Metal', 'Thrash', 'Death Metal', 'Black Metal', 'Speed Metal', 'Power Metal', 'Doom Metal', 'Sludge Metal',
  'Nu Metal', 'Grindcore', 'Industrial Metal', 'Stoner Rock', 'Neo-Classical Metal', 'Alternative Metal', 'Funk Metal',
]);
estilos(2, 'rock-and-roll', ['Rockabilly', 'Doo Wop', 'Twist', 'Psychobilly']);
estilos(1, 'metal', ['Hard Rock']);
estilos(2, 'reggae', ['Reggae', 'Roots Reggae', 'Dub', 'Ska', 'Rocksteady', 'Dancehall', 'Ragga', 'Reggae-Pop', 'Lovers Rock']);
estilos(2, 'disco', ['Disco', 'Italo-Disco', 'Euro-Disco', 'Hi NRG']);
estilos(2, 'soul', ['Soul', 'Rhythm & Blues', 'Neo Soul', 'Contemporary R&B', 'Doo Wop', 'Northern Soul', 'Southern Soul']);
estilos(2, 'funk', ['Funk', 'P.Funk', 'Boogie', 'Go-Go', 'Minneapolis Sound', 'Miami Bass']);
estilos(2, 'rap', ['Pop Rap', 'Conscious', 'Gangsta', 'Boom Bap', 'Trap', 'Hardcore Hip-Hop', 'Hip Hop']);
estilos(2, 'blues', ['Chicago Blues', 'Electric Blues', 'Delta Blues', 'Country Blues', 'Piano Blues', 'Modern Electric Blues', 'Jump Blues', 'Harmonica Blues', 'Louisiana Blues', 'East Coast Blues']);
estilos(2, 'country', ['Country', 'Honky Tonk', 'Bluegrass', 'Cajun', 'Zydeco']);
estilos(2, 'trilhas', ['Soundtrack', 'Score', 'Musical']);
estilos(2, 'infantil', ['Story', 'Nursery Rhymes', 'Educational']);
estilos(2, 'outros', ['Comedy', 'Poetry', 'Spoken Word', 'Dialogue', 'Speech', 'Monolog', 'Interview', 'Radioplay', 'Marches']);
estilos(2, 'latina', [
  'Tango', 'Milonga', 'Flamenco', 'Copla', 'Salsa', 'Merengue', 'Mambo', 'Cha-Cha', 'Rumba', 'Guaracha', 'Bachata',
  'Pachanga', 'Afro-Cuban', 'Son Montuno', 'Danzon', 'Guajira', 'Bomba', 'Jibaro', 'Cuatro', 'Ranchera', 'Mariachi',
  'Corrido', 'Nueva Cancion', 'Nueva Trova', 'Trova', 'Guarania', 'Chacarera', 'Zamba', 'Andean Music', 'Música Criolla',
  'Candombe', 'Cumbia', 'Bolero', 'Chamamé', 'Reggaeton', 'Latin Pop',
]);
estilos(2, 'mundo', [
  'Fado', 'Polka', 'Volksmusik', 'Musette', 'Canzone Napoletana', 'Laïkó', 'Klezmer', 'Cantorial', 'Indian Classical',
  'Zouk', 'Kizomba', 'Morna', 'Funaná', 'Compas', 'Salegy', 'Hawaiian', 'Pacific', 'Calypso', 'Soca', 'Beguine',
  'African', 'Afrobeat', 'Highlife', 'Schlager',
]);
estilos(1, 'mpb', ['MPB']);
estilos(1, 'rock', [
  'Pop Rock', 'Rock & Roll', 'Soft Rock', 'Folk Rock', 'Classic Rock', 'Blues Rock', 'New Wave',
  'Psychedelic Rock', 'Alternative Rock', 'Beat', 'Punk',
  'AOR', 'Glam', 'Indie Rock', 'Arena Rock', 'Southern Rock', 'Garage Rock', 'Post-Punk', 'Psychedelic',
  'Hardcore', 'Surf', 'Power Pop', 'Mod',
  'Acid Rock', 'Goth Rock', 'Pub Rock',
  'Grunge', 'Britpop', 'Math Rock', 'Noise Rock', 'Avantgarde', 'Country Rock',
]);
estilos(1, 'eletronica', [
  'Synth-pop', 'House', 'Electro', 'Euro House', 'Techno', 'Eurodance', 'Italodance', 'Downtempo', 'Ambient',
  'Experimental', 'Freestyle', 'Trance', 'Industrial', 'Deep House', 'Garage House', 'Trip Hop', 'Breaks', 'Acid House',
  'Hip-House', 'Bass Music', 'Leftfield', 'Abstract', 'Synthwave', 'Drum n Bass', 'Electro House', 'Tech House', 'New Age',
]);
estilos(1, 'orquestras', ['Light Music', 'Space-Age', 'Lounge', 'Instrumental', 'Exotica', 'Marimba', 'Organ']);
estilos(1, 'pop', ['Europop', 'Dance-pop', 'Indie Pop', 'Vocal', 'Alt-Pop', 'Sunshine Pop', 'Baroque Pop', 'Yé-Yé']);

// Estilos românticos: contam como "Romântica" só em disco nacional.
const ROMANTICOS = new Set(['Romantic', 'Ballad', 'Easy Listening', 'Chanson']);
// Folk e música celta de fora; em disco nacional, "Folk" é música regional.
const ESTILOS_FOLK = new Set(['Folk', 'Celtic']);
// Música religiosa afro-brasileira: o Discogs marca como "Religious" junto com estes estilos.
const ESTILOS_AFRO = new Set(['African', 'Batucada', 'Afoxé', 'Candomblé', 'Umbanda', 'Capoeira']);

const FOLK_DISCOGS = 'Folk, World, & Country';

// Gênero amplo do Discogs, quando nenhum estilo decidiu. A ordem é a prioridade.
const POR_GENERO = [
  ['Classical', () => 'classica'],
  ["Children's", () => 'infantil'],
  ['Stage & Screen', () => 'trilhas'],
  ['Reggae', () => 'reggae'],
  ['Hip Hop', (nacional) => (nacional ? 'rap-nacional' : 'rap')],
  ['Blues', () => 'blues'],
  ['Jazz', () => 'jazz'],
  ['Funk / Soul', () => 'soul'],
  ['Electronic', () => 'eletronica'],
  ['Rock', (nacional) => (nacional ? 'rock-nacional' : 'rock')],
  ['Pop', () => 'pop'],
  ['Non-Music', () => 'outros'],
  ['Brass & Military', () => 'outros'],
];

// Estilos que não viram gênero extra: aparecem em discos de outros gêneros sem dizer muito deles.
const SEM_EXTRA = new Set(['Rhythm & Blues', 'Doo Wop', 'Marches', 'Schlager', 'Polka']);

/**
 * O que o Discogs diz de um lançamento, nos gêneros da loja: `principal` (o estilo mais específico,
 * senão o gênero amplo) e `fortes` (os gêneros de todos os estilos claros, peso 2 ou 3).
 * `nacional`: true quando o disco é brasileiro (ver ehNacional).
 */
export function analisarGeneros({ genres = [], styles = [] } = {}, { nacional = false } = {}) {
  // Religioso afro-brasileiro antes de tudo: senão "Religious" ou "Batucada" levariam para Gospel ou Samba.
  if (styles.includes('Religious') && styles.some((e) => ESTILOS_AFRO.has(e)) && !styles.includes('Gospel')) {
    return { principal: 'afro-brasileira', fortes: [] };
  }

  let melhor = null;
  const fortes = [];
  for (const estilo of styles) {
    let regra = ESTILOS[estilo];
    if (!regra && ROMANTICOS.has(estilo) && nacional) regra = { genero: 'romantica', peso: 1 };
    if (!regra && estilo === 'Easy Listening' && !nacional) regra = { genero: 'orquestras', peso: 1 };
    if (!regra && ESTILOS_FOLK.has(estilo)) regra = nacional ? { genero: 'regional', peso: 1 } : { genero: 'folk', peso: 2 };
    if (!regra) continue;
    // Rock, funk e rap feitos no Brasil; bolero e cumbia brasileiros. Estilo brasileiro por natureza
    // (Sertanejo, Favela Funk) nunca vira a versão de fora.
    let genero = nacional ? generoNaOrigem(regra.genero, true) : regra.genero;
    if (nacional && estilo === 'Bolero') genero = 'romantica';
    if (nacional && estilo === 'Cumbia') genero = 'lambada';
    // "Country" em disco brasileiro é o sertanejo.
    if (nacional && genero === 'country') genero = 'sertanejo';
    if (!melhor || regra.peso > melhor.peso) melhor = { genero, peso: regra.peso };
    if (regra.peso >= 2 && !SEM_EXTRA.has(estilo) && genero !== 'outros' && !fortes.includes(genero)) fortes.push(genero);
  }
  if (melhor) return { principal: melhor.genero, fortes };

  // Música cristã sem estilo de gênero musical.
  if (styles.includes('Religious')) return { principal: 'gospel', fortes };

  for (const [genero, traduzir] of POR_GENERO) {
    if (genres.includes(genero)) return { principal: traduzir(nacional), fortes };
  }
  // "Folk, World, & Country" é o mais amplo: no Brasil é regional, fora é música do mundo.
  if (genres.includes(FOLK_DISCOGS)) return { principal: nacional ? 'regional' : 'mundo', fortes };
  return { principal: null, fortes };
}

/** O principal primeiro, depois os extras, sem repetir. */
export function juntarGeneros(principal, extras = []) {
  return [...new Set([principal, ...extras].filter(Boolean))];
}

/** Gêneros da loja de um lançamento do Discogs: o principal primeiro, depois os outros estilos claros. */
export function traduzirGeneros(discogs = {}, opcoes = {}) {
  const { principal, fortes } = analisarGeneros(discogs, opcoes);
  return principal ? juntarGeneros(principal, fortes) : [];
}

// Palavras e terminações comuns em português e raras em inglês.
const MARCAS_PT = /(ção|ções|ão|ões|ã|õ|ç)|\b(de|do|da|dos|das|que|não|meu|minha|você|pra|para|amor|coração|é|um|uma|nos|na|no|sem|eu|te)\b/i;

/** Fração dos títulos das faixas que parecem português (0 a 1). */
export function fracaoPortugues(titulos = []) {
  const validos = titulos.filter((t) => typeof t === 'string' && t.trim());
  if (!validos.length) return 0;
  return validos.filter((t) => MARCAS_PT.test(t)).length / validos.length;
}

/**
 * Disco brasileiro? "Latin" no Discogs sem estilo de fora (tango, salsa...), ou títulos das faixas
 * em português. Sem faixas e sem "Latin" volta null: quem chama decide pelo artista.
 */
export function ehNacional({ genres = [], styles = [] } = {}, titulos = []) {
  if (genres.includes('Latin')) {
    return !styles.some((e) => ['latina', 'mundo'].includes(ESTILOS[e]?.genero) && e !== 'Bolero' && e !== 'Cumbia');
  }
  if (!titulos.length) return null;
  return fracaoPortugues(titulos) >= 0.4;
}

/**
 * Gêneros da loja de um disco (o principal primeiro), a partir do que o Discogs disse
 * (discos.genero_discogs) e dos títulos das faixas. `nacionalPeloArtista` decide quando nem
 * as faixas nem "Latin" decidem.
 */
export function generosDoDisco(generoDiscogs, titulos = [], nacionalPeloArtista = null) {
  const genres = generoDiscogs?.genres || [];
  const styles = generoDiscogs?.styles || [];
  if (!genres.length && !styles.length) return [];
  const nacional = ehNacional({ genres, styles }, titulos) ?? nacionalPeloArtista ?? false;
  return traduzirGeneros({ genres, styles }, { nacional });
}

/** Como generosDoDisco, mas separado: `principal`, `fortes` (estilos claros) e se o disco é `nacional`. */
export function analisarDisco(generoDiscogs, titulos = [], nacionalPeloArtista = null) {
  const genres = generoDiscogs?.genres || [];
  const styles = generoDiscogs?.styles || [];
  const nacional = ehNacional({ genres, styles }, titulos) ?? nacionalPeloArtista ?? false;
  if (!genres.length && !styles.length) return { principal: null, fortes: [], nacional };
  return { ...analisarGeneros({ genres, styles }, { nacional }), nacional };
}

/** Disco brasileiro pelo gênero principal, quando ele só existe de um lado; senão vale `nacional`. */
export function nacionalPeloGenero(principal, nacional) {
  if (SO_BRASILEIROS.has(principal)) return true;
  if (SO_DE_FORA.has(principal)) return false;
  return nacional;
}

/** Gênero de reserva: disco que nada identificou vai para "Outros". */
export const GENERO_RESERVA = 'outros';

/**
 * Gêneros finais de um disco, a mesma regra no script e no cadastro pelo estoque.
 * `principal`: o gênero principal já escolhido (correção, artista ou Discogs). `extras`: gêneros
 * a mais (correções e estilos claros do Discogs). `nacional`: o que o Discogs e as faixas disseram;
 * `origem` ("br" ou "fora") vence quando o artista foi corrigido à mão. Coletânea fica com dois.
 * Sem principal, "Outros".
 */
export function montarGeneros({ principal, extras = [], nacional = false, origem = null, coletanea = false } = {}) {
  if (!principal) return [GENERO_RESERVA];
  const brasileiro = origem ? origem === 'br' : nacionalPeloGenero(principal, nacional);
  // Regional de artista de fora vira Música do Mundo.
  const primeiro = generoNaOrigem(principal, brasileiro) || 'mundo';
  // Na versão brasileira ou de fora conforme o disco; em disco brasileiro, gênero só de fora não
  // entra como extra (a não ser Latina: tango, bolero).
  const resto = extras
    .map((g) => generoNaOrigem(g, brasileiro))
    .filter((g) => g && !(brasileiro && SO_DE_FORA.has(g) && g !== 'latina'));
  let generos = juntarGeneros(primeiro, resto);
  // "Outros" é o resto: sai quando o disco tem gênero melhor.
  if (generos.length > 1) generos = generos.filter((g) => g !== GENERO_RESERVA);
  return coletanea ? generos.slice(0, 2) : generos;
}

/** Gênero principal mais comum entre os discos já classificados de um artista (null se empatar). */
export function generoMaisComum(listasDeGeneros = []) {
  const votos = new Map();
  for (const lista of listasDeGeneros) {
    const g = Array.isArray(lista) ? lista[0] : null;
    if (g && g !== GENERO_RESERVA) votos.set(g, (votos.get(g) || 0) + 1);
  }
  const ordem = [...votos.entries()].sort((a, b) => b[1] - a[1]);
  if (!ordem.length || (ordem[1] && ordem[1][1] === ordem[0][1])) return null;
  return ordem[0][0];
}
