// Gêneros da loja: a lista que o cliente vê, e a tradução dos gêneros e estilos do Discogs para ela.
// Cada disco fica num gênero só. O Discogs chama quase toda a música brasileira de "Latin";
// o que separa samba, forró, sertanejo e os outros é o estilo.

const g = (id, nome, descricao) => ({ id, nome, descricao });

export const GENEROS = [
  g('mpb', 'MPB', 'A canção brasileira de autor que nasceu nos festivais dos anos 1960: Caetano, Gil, Chico, Milton, Elis e Gal.'),
  g('samba', 'Samba', 'O samba das rodas do Rio, o samba-canção, o partido-alto, os sambas-enredo e as marchinhas de carnaval.'),
  g('pagode', 'Pagode', 'O samba de fundo de quintal com banjo e tantã, de Fundo de Quintal, Zeca Pagodinho, Raça Negra e Só Pra Contrariar.'),
  g('choro', 'Choro', 'A música instrumental do bandolim, da flauta e do cavaquinho, de Pixinguinha, Jacob do Bandolim e Waldir Azevedo.'),
  g('bossa-nova', 'Bossa Nova', 'O samba de voz baixa e violão de João Gilberto, Tom Jobim, Vinicius de Moraes, Nara Leão e Astrud Gilberto.'),
  g('rock-nacional', 'Rock Nacional', 'O rock feito no Brasil, da Jovem Guarda de Roberto e Erasmo aos anos 1980 de Titãs, Legião Urbana e Paralamas.'),
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
  g('funk', 'Funk', 'O funk de James Brown, do Earth, Wind & Fire e do Parliament, e o funk carioca.'),
  g('rap', 'Rap', 'O hip hop, do Run DMC e LL Cool J aos Racionais e ao rap nacional.'),
  g('disco', 'Disco', 'A música das pistas dos anos 1970, de Donna Summer, Bee Gees e Chic às Frenéticas.'),
  g('jazz', 'Jazz', 'Do swing das big bands ao bebop, ao cool e ao fusion, de Duke Ellington e Miles Davis a Ella Fitzgerald.'),
  g('blues', 'Blues', 'O blues de B.B. King, Muddy Waters, John Lee Hooker e Etta James.'),
  g('eletronica', 'Eletrônica', 'Do synth-pop e da música de pista dos anos 1980 à house e ao techno.'),
  g('reggae', 'Reggae', 'O reggae da Jamaica de Bob Marley e Jimmy Cliff e o reggae brasileiro.'),
  g('folk', 'Folk', 'O folk do violão e da voz, de Bob Dylan, Joan Baez e Simon & Garfunkel à música celta.'),
  g('country', 'Country', 'A música do interior dos Estados Unidos, de Johnny Cash e Willie Nelson a Dolly Parton e Kenny Rogers.'),
  g('latina-mundo', 'Latina e Mundo', 'Tango, salsa, bolero, mariachi, fado, flamenco e a música de raiz de outros países.'),
  g('afro-brasileira', 'Afro-brasileira', 'Os cantos de Umbanda e Candomblé, o afoxé e a música da capoeira.'),
  g('gospel', 'Gospel', 'Música cristã: hinos, corais, gospel americano e louvor brasileiro.'),
  g('classica', 'Clássica', 'Sinfonias, óperas, música de câmara e piano, de Bach, Mozart e Beethoven a Villa-Lobos.'),
  g('trilhas', 'Trilhas Sonoras', 'Trilhas de filmes, novelas e musicais.'),
  g('infantil', 'Infantil', 'Discos para crianças: cantigas de roda, histórias e os sucessos da TV.'),
  g('outros', 'Outros', 'O que não cabe nos outros gêneros: humor, poesia, discursos, bandas militares e coletâneas variadas.'),
];

const POR_ID = new Map(GENEROS.map((x) => [x.id, x]));

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
estilos(3, 'rock-nacional', ['Jovem Guarda']);
estilos(3, 'forro', ['Forró', 'Baião', 'Xote', 'Xaxado']);
estilos(3, 'sertanejo', ['Sertanejo', 'Caipira']);
estilos(3, 'regional', ['Frevo', 'Maracatu', 'Repente', 'Embolada', 'Coco', 'Ciranda', 'Bumba-meu-boi']);
estilos(3, 'axe', ['Axé']);
estilos(3, 'carimbo', ['Carimbó', 'Siriá']);
estilos(3, 'lambada', ['Lambada', 'Guitarrada']);
estilos(3, 'brega', ['Brega']);
estilos(3, 'funk', ['Favela Funk']);
estilos(3, 'gospel', ['Gospel']);
estilos(2, 'samba', ['Samba', 'Samba-Canção', 'Samba-Enredo', 'Samba Enredo', 'Partido Alto', 'Batucada', 'Marcha Carnavalesca']);
estilos(2, 'bossa-nova', ['Bossa Nova', 'Bossanova']);
estilos(2, 'mpb', ['Tropicalia', 'Tropicália']);
estilos(2, 'romantica', ['Seresta']);
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
estilos(2, 'latina-mundo', [
  'Tango', 'Milonga', 'Fado', 'Flamenco', 'Copla', 'Salsa', 'Merengue', 'Mambo', 'Cha-Cha', 'Rumba', 'Guaracha',
  'Bachata', 'Pachanga', 'Afro-Cuban', 'Son Montuno', 'Danzon', 'Guajira', 'Bomba', 'Jibaro', 'Cuatro', 'Ranchera',
  'Mariachi', 'Corrido', 'Nueva Cancion', 'Nueva Trova', 'Trova', 'Guarania', 'Chacarera', 'Zamba', 'Andean Music',
  'Música Criolla', 'Candombe', 'Polka', 'Volksmusik', 'Musette', 'Canzone Napoletana', 'Laïkó', 'Klezmer',
  'Indian Classical', 'Zouk', 'Kizomba', 'Morna', 'Funaná', 'Compas', 'Salegy', 'Hawaiian', 'Pacific', 'Calypso',
  'Soca', 'Beguine', 'Cumbia', 'Bolero', 'Chamamé', 'African', 'Afrobeat', 'Highlife', 'Schlager',
]);
estilos(1, 'mpb', ['MPB']);
estilos(1, 'rock', [
  'Pop Rock', 'Rock & Roll', 'Soft Rock', 'Folk Rock', 'Prog Rock', 'Hard Rock', 'Classic Rock', 'Blues Rock', 'New Wave',
  'Psychedelic Rock', 'Alternative Rock', 'Art Rock', 'Heavy Metal', 'Beat', 'Punk', 'Rockabilly', 'Symphonic Rock',
  'AOR', 'Glam', 'Indie Rock', 'Arena Rock', 'Thrash', 'Southern Rock', 'Garage Rock', 'Post-Punk', 'Psychedelic',
  'Grindcore', 'Hardcore', 'Surf', 'Krautrock', 'Death Metal', 'Power Pop', 'Mod', 'Space Rock', 'Speed Metal',
  'Black Metal', 'Twist', 'Acid Rock', 'Goth Rock', 'Stoner Rock', 'Pub Rock', 'Nu Metal', 'Power Metal', 'Doom Metal',
  'Grunge', 'Britpop', 'Math Rock', 'Noise Rock', 'Rock Opera', 'Avantgarde', 'Country Rock',
]);
estilos(1, 'eletronica', [
  'Synth-pop', 'House', 'Electro', 'Euro House', 'Techno', 'Eurodance', 'Italodance', 'Downtempo', 'Ambient',
  'Experimental', 'Freestyle', 'Trance', 'Industrial', 'Deep House', 'Garage House', 'Trip Hop', 'Breaks', 'Acid House',
  'Hip-House', 'Bass Music', 'Leftfield', 'Abstract', 'Synthwave', 'Drum n Bass', 'Electro House', 'Tech House', 'New Age',
]);
estilos(1, 'pop', ['Europop', 'Dance-pop', 'Indie Pop', 'Vocal', 'Light Music', 'Alt-Pop', 'Latin Pop', 'Sunshine Pop', 'Baroque Pop', 'Yé-Yé']);

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
  ['Hip Hop', () => 'rap'],
  ['Blues', () => 'blues'],
  ['Jazz', () => 'jazz'],
  ['Funk / Soul', () => 'soul'],
  ['Electronic', () => 'eletronica'],
  ['Rock', (nacional) => (nacional ? 'rock-nacional' : 'rock')],
  ['Pop', () => 'pop'],
  ['Non-Music', () => 'outros'],
  ['Brass & Military', () => 'outros'],
];

/**
 * Traduz o que o Discogs diz de um lançamento para um gênero da loja (lista com 0 ou 1 item).
 * `nacional`: true quando o disco é brasileiro (ver ehNacional).
 */
export function traduzirGeneros({ genres = [], styles = [] } = {}, { nacional = false } = {}) {
  // Religioso afro-brasileiro antes de tudo: senão "Religious" ou "Batucada" levariam para Gospel ou Samba.
  if (styles.includes('Religious') && styles.some((e) => ESTILOS_AFRO.has(e)) && !styles.includes('Gospel')) {
    return ['afro-brasileira'];
  }

  let melhor = null;
  for (const estilo of styles) {
    let regra = ESTILOS[estilo];
    if (!regra && ROMANTICOS.has(estilo) && nacional) regra = { genero: 'romantica', peso: 1 };
    if (!regra && ESTILOS_FOLK.has(estilo)) regra = nacional ? { genero: 'regional', peso: 1 } : { genero: 'folk', peso: 2 };
    if (!regra) continue;
    let genero = regra.genero;
    // Rock feito no Brasil; bolero e cumbia brasileiros.
    if (genero === 'rock' && nacional) genero = 'rock-nacional';
    if (nacional && estilo === 'Bolero') genero = 'romantica';
    if (nacional && estilo === 'Cumbia') genero = 'lambada';
    // "Country" em disco brasileiro é o sertanejo.
    if (nacional && genero === 'country') genero = 'sertanejo';
    if (!melhor || regra.peso > melhor.peso) melhor = { genero, peso: regra.peso };
  }
  if (melhor) return [melhor.genero];

  // Música cristã sem estilo de gênero musical.
  if (styles.includes('Religious')) return ['gospel'];

  for (const [genero, traduzir] of POR_GENERO) {
    if (genres.includes(genero)) return [traduzir(nacional)];
  }
  // "Folk, World, & Country" é o mais amplo: no Brasil é regional, fora é música do mundo.
  if (genres.includes(FOLK_DISCOGS)) return [nacional ? 'regional' : 'latina-mundo'];
  return [];
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
    return !styles.some((e) => ESTILOS[e]?.genero === 'latina-mundo' && e !== 'Bolero' && e !== 'Cumbia');
  }
  if (!titulos.length) return null;
  return fracaoPortugues(titulos) >= 0.4;
}

/**
 * Gênero da loja de um disco (lista com 0 ou 1 item), a partir do que o Discogs disse
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
