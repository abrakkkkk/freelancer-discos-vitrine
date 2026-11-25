// Gêneros da loja: a lista que o cliente vê, e a tradução dos gêneros e estilos do Discogs para ela.
// O Discogs chama quase toda a música brasileira de "Latin"; o que separa MPB, samba e bossa nova é o estilo.

export const GENEROS = [
  {
    id: 'mpb',
    nome: 'MPB',
    descricao:
      'A canção brasileira de autor que surgiu nos festivais dos anos 1960, misturando samba, bossa nova, baião e as guitarras do rock. Caetano Veloso, Gilberto Gil, Chico Buarque, Milton Nascimento, Elis Regina e Gal Costa estão entre os nomes que deram forma ao gênero.',
  },
  {
    id: 'samba-pagode',
    nome: 'Samba e Pagode',
    descricao:
      'Nascido nas rodas do Rio de Janeiro no começo do século XX, o samba virou a música mais tocada do país. Aqui estão também o samba-canção, o choro, o partido-alto e o pagode, que nos anos 1980 levou o banjo e o tantã para as rodas de fundo de quintal.',
  },
  {
    id: 'bossa-nova',
    nome: 'Bossa Nova',
    descricao:
      'Surgiu no fim dos anos 1950 com a batida de violão de João Gilberto e as canções de Tom Jobim e Vinicius de Moraes: o samba tocado baixinho, com harmonias do jazz. Foi o gênero que levou a música brasileira para o mundo.',
  },
  {
    id: 'rock-nacional',
    nome: 'Rock Nacional',
    descricao:
      'O rock cantado em português, da Jovem Guarda dos anos 1960 às bandas que lotaram estádios nos anos 1980, como Legião Urbana, Titãs, Paralamas do Sucesso e Barão Vermelho.',
  },
  {
    id: 'rock',
    nome: 'Rock',
    descricao:
      'O rock de fora do Brasil, do rock and roll dos anos 1950 ao progressivo, ao punk e ao metal. Dos Beatles e Rolling Stones ao Pink Floyd e Led Zeppelin, muitos desses discos saíram em edição nacional na época.',
  },
  {
    id: 'pop',
    nome: 'Pop',
    descricao:
      'Música feita para o rádio e para as pistas, do Brasil e de fora, com refrões que todo mundo canta junto: de ABBA e Michael Jackson a Madonna, Rita Lee e Kid Abelha.',
  },
  {
    id: 'romantica-brega',
    nome: 'Romântica e Brega',
    descricao:
      'As canções de amor e dor de cotovelo que tocavam no rádio AM e nas festas: boleros, baladas e o brega de Waldick Soriano, Odair José, Reginaldo Rossi e Amado Batista.',
  },
  {
    id: 'sertanejo-forro',
    nome: 'Sertanejo, Forró e Regional',
    descricao:
      'A música do interior e do Nordeste: a moda de viola caipira, as duplas sertanejas, o baião e o forró de Luiz Gonzaga e Jackson do Pandeiro, o frevo de Pernambuco e os ritmos de cada região do país.',
  },
  {
    id: 'carimbo-lambada',
    nome: 'Carimbó e Lambada',
    descricao:
      'Os ritmos do Norte: o carimbó, a lambada, a guitarrada e a cumbia, de Pinduca, Vieira e Seu Conjunto, Teixeira de Manaus e Dona Onete.',
  },
  {
    id: 'soul-funk-rap',
    nome: 'Soul, Funk e Rap',
    descricao:
      'A música negra dos Estados Unidos e do Brasil: soul, funk, disco e rap. Da Motown e de James Brown a Tim Maia, Cassiano e Banda Black Rio, que trouxeram esse suingue para cá nos anos 1970.',
  },
  {
    id: 'jazz-blues',
    nome: 'Jazz e Blues',
    descricao:
      'Do blues do sul dos Estados Unidos às big bands, ao bebop e ao jazz modal: Louis Armstrong, Ella Fitzgerald, Miles Davis, John Coltrane. Inclui também o jazz instrumental feito no Brasil.',
  },
  {
    id: 'eletronica',
    nome: 'Eletrônica',
    descricao:
      'Música feita com sintetizadores e máquinas de ritmo, dos pioneiros Kraftwerk e Jean-Michel Jarre à música de pista dos anos 1980 e 1990, como house e techno.',
  },
  {
    id: 'reggae',
    nome: 'Reggae',
    descricao:
      'Nascido na Jamaica no fim dos anos 1960, a partir do ska e do rocksteady, o reggae ganhou o mundo com Bob Marley, Peter Tosh e Jimmy Cliff. Aqui também estão o dub e o reggae feito no Brasil.',
  },
  {
    id: 'folk',
    nome: 'Folk',
    descricao: 'O folk de fora do Brasil, do violão e da voz de Bob Dylan, Joan Baez e Jim Croce à música celta e ao bluegrass.',
  },
  {
    id: 'gospel',
    nome: 'Gospel',
    descricao: 'Música religiosa cristã, dos hinos e corais ao gospel moderno, com artistas brasileiros e estrangeiros.',
  },
  {
    id: 'classica',
    nome: 'Clássica',
    descricao:
      'Música de concerto: sinfonias, óperas, música de câmara e obras para piano, de Bach, Mozart e Beethoven a Villa-Lobos, em gravações de orquestras, coros e solistas.',
  },
  {
    id: 'trilhas-outros',
    nome: 'Trilhas, Infantil e outros',
    descricao:
      'Trilhas sonoras de filmes e novelas, discos infantis e o que não cabe nos outros gêneros, como gravações de humor, de bandas militares e discos falados.',
  },
];

const POR_ID = new Map(GENEROS.map((g) => [g.id, g]));

export const generoPorId = (id) => POR_ID.get(id) || null;
export const ehGeneroValido = (id) => POR_ID.has(id);

/** Gêneros gravados no disco que existem na lista, na ordem gravada. */
export function generosDoItem(item) {
  return (Array.isArray(item?.generos) ? item.generos : []).map(generoPorId).filter(Boolean);
}

// Estilo do Discogs → gênero da loja. Os estilos vêm antes dos gêneros porque são mais precisos.
const POR_ESTILO = {
  MPB: 'mpb',
  'Tropicalia': 'mpb',
  'Tropicália': 'mpb',
  Samba: 'samba-pagode',
  Pagode: 'samba-pagode',
  'Samba-Canção': 'samba-pagode',
  Choro: 'samba-pagode',
  'Partido Alto': 'samba-pagode',
  'Samba-Enredo': 'samba-pagode',
  'Samba Enredo': 'samba-pagode',
  'Bossa Nova': 'bossa-nova',
  Bossanova: 'bossa-nova',
  'Jovem Guarda': 'rock-nacional',
  Forró: 'sertanejo-forro',
  Baião: 'sertanejo-forro',
  Sertanejo: 'sertanejo-forro',
  Caipira: 'sertanejo-forro',
  Frevo: 'sertanejo-forro',
  Xote: 'sertanejo-forro',
  Maracatu: 'sertanejo-forro',
  Axé: 'sertanejo-forro',
  Carimbó: 'carimbo-lambada',
  Lambada: 'carimbo-lambada',
  Cumbia: 'carimbo-lambada',
  Guitarrada: 'carimbo-lambada',
  Siriá: 'carimbo-lambada',
  Seresta: 'romantica-brega',
  Batucada: 'samba-pagode',
  'Marcha Carnavalesca': 'samba-pagode',
  'Favela Funk': 'soul-funk-rap',
  Gospel: 'gospel',
  Religious: 'gospel',
  Bolero: 'romantica-brega',
  Brega: 'romantica-brega',
  Reggae: 'reggae',
  'Roots Reggae': 'reggae',
  Dub: 'reggae',
  Ska: 'reggae',
  Rocksteady: 'reggae',
  Dancehall: 'reggae',
  Ragga: 'reggae',
  Disco: 'soul-funk-rap',
  Soundtrack: 'trilhas-outros',
  Score: 'trilhas-outros',
  Musical: 'trilhas-outros',
};

// Estilos românticos só contam como "Romântica e Brega" em disco nacional ou latino.
const ROMANTICOS = new Set(['Romantic', 'Ballad', 'Easy Listening', 'Chanson']);

const FOLK_DISCOGS = 'Folk, World, & Country';

// Folk de fora: em disco nacional, "Folk" no Discogs é música regional (fica em sertanejo).
const ESTILOS_FOLK = new Set(['Folk', 'Celtic', 'Bluegrass']);

// Estilos que não impedem "Folk, World, & Country" nacional de virar sertanejo.
const ESTILOS_DO_INTERIOR = new Set(['Folk', 'Country']);

// Música de raiz de fora do Brasil, sem gênero próprio na loja: vai para "Trilhas, Infantil e outros".
const ESTILOS_DE_FORA = new Set([
  'Country', 'Honky Tonk', 'Cajun', 'Zydeco', 'Tango', 'Milonga', 'Fado', 'Flamenco', 'Copla', 'Salsa',
  'Merengue', 'Mambo', 'Cha-Cha', 'Rumba', 'Guaracha', 'Bachata', 'Pachanga', 'Afro-Cuban', 'Son Montuno',
  'Danzon', 'Guajira', 'Bomba', 'Jibaro', 'Cuatro', 'Ranchera', 'Mariachi', 'Corrido', 'Nueva Cancion',
  'Nueva Trova', 'Trova', 'Guarania', 'Chamamé', 'Chacarera', 'Zamba', 'Andean Music', 'Música Criolla',
  'Candombe', 'Polka', 'Volksmusik', 'Musette', 'Canzone Napoletana', 'Laïkó', 'Klezmer', 'Cantorial',
  'African', 'Indian Classical', 'Zouk', 'Kizomba', 'Morna', 'Funaná', 'Compas', 'Salegy', 'Hawaiian', 'Pacific',
]);

// Gênero do Discogs → gênero da loja, quando nenhum estilo resolveu.
function porGenero(genero, nacional) {
  switch (genero) {
    case 'Rock':
      return nacional ? 'rock-nacional' : 'rock';
    case 'Pop':
      return 'pop';
    case 'Jazz':
    case 'Blues':
      return 'jazz-blues';
    case 'Funk / Soul':
    case 'Hip Hop':
      return 'soul-funk-rap';
    case 'Electronic':
      return 'eletronica';
    case 'Reggae':
      return 'reggae';
    case 'Classical':
      return 'classica';
    case 'Stage & Screen':
    case "Children's":
    case 'Non-Music':
    case 'Brass & Military':
      return 'trilhas-outros';
    default:
      return null;
  }
}

const MAX_GENEROS = 2;

/**
 * Traduz o que o Discogs diz de um lançamento para até 2 gêneros da loja, o principal primeiro.
 * `nacional`: true quando o disco é brasileiro (ver ehNacional). Volta [] quando não dá para decidir.
 */
export function traduzirGeneros({ genres = [], styles = [] } = {}, { nacional = false } = {}) {
  const latino = genres.includes('Latin');
  const saida = [];
  const somar = (id) => {
    if (id && !saida.includes(id) && saida.length < MAX_GENEROS) saida.push(id);
  };

  for (const estilo of styles) {
    if (ROMANTICOS.has(estilo)) {
      if (nacional || latino) somar('romantica-brega');
    } else if (ESTILOS_FOLK.has(estilo)) {
      if (!nacional) somar('folk');
    } else {
      somar(POR_ESTILO[estilo]);
    }
  }
  // O gênero amplo do Discogs só entra quando nenhum estilo resolveu: senão um disco de MPB
  // marcado também como "Folk, World, & Country" viraria sertanejo.
  if (!saida.length) for (const genero of genres) somar(porGenero(genero, nacional));
  // "Folk, World, & Country" é o mais amplo: só decide quando nada mais decidiu.
  if (!saida.length && genres.includes(FOLK_DISCOGS)) {
    if (!nacional) somar('trilhas-outros');
    else if (styles.every((e) => ESTILOS_DO_INTERIOR.has(e))) somar('sertanejo-forro');
  }
  if (!saida.length && styles.some((e) => ESTILOS_DE_FORA.has(e))) somar('trilhas-outros');
  return saida;
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
 * Disco brasileiro? "Latin" no Discogs ou títulos das faixas em português.
 * Sem faixas e sem "Latin" volta null: quem chama decide pelo artista.
 */
export function ehNacional({ genres = [] } = {}, titulos = []) {
  if (genres.includes('Latin')) return true;
  if (!titulos.length) return null;
  return fracaoPortugues(titulos) >= 0.4;
}

/**
 * Gêneros da loja de um disco, a partir do que o Discogs disse (discos.genero_discogs) e dos
 * títulos das faixas. `nacionalPeloArtista` decide quando nem "Latin" nem as faixas decidem.
 */
export function generosDoDisco(generoDiscogs, titulos = [], nacionalPeloArtista = null) {
  const genres = generoDiscogs?.genres || [];
  const styles = generoDiscogs?.styles || [];
  if (!genres.length && !styles.length) return [];
  const nacional = ehNacional({ genres }, titulos) ?? nacionalPeloArtista ?? false;
  return traduzirGeneros({ genres, styles }, { nacional });
}
