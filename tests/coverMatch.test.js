import { describe, it, expect } from 'vitest';
import {
  scoreCandidate,
  tokenize,
  isVariousArtist,
  parseDiscogsTitle,
  discogsRefFromImageUrl,
} from '../src/utils/coverMatch';

// Casos reais do acervo, verificados manualmente contra o Discogs e o iTunes (auditoria de capas).
// [artista, titulo, ano] do banco  x  [artista, titulo, ano] da capa encontrada.
const CAPAS_CORRETAS = [
  [['Sambão', 'Vozes Do Brasil', 1973], ['Sambão', 'Vozes Do Brasil', 1973]],
  [['Maria Creusa', 'Sessão Nostalgia', 1974], ['Maria Creuza', 'Sessão Nostalgia', 1974]],
  [['Maria Bethania', 'Álibi', 1978], ['Maria Bethânia', 'Álibi', 1978]],
  [['Raul Seixas & Lee Jackson', 'Os Maiores Sucessos do Rock', 1984], ['Raul Seixas / Lee Jackson', 'Os Maiores Sucessos do Rock', 1984]],
  [['Marisa', 'Marisa', 1974], ['Marisa', 'Marisa', 1974]],
  [['Ravi Shankar', 'Ravi Shankar at The Monterey International Pop Festival Live', ''], ['Ravi Shankar', 'Live: Ravi Shankar At The Monterey International Pop Festival', 1998]],
  [['Marillion', '1982-1992 - A Singles Collection', 1992], ['Marillion', '1982-1992 - A Singles Collection', 1992]],
  [['Paulo Sérgio', 'Paulo Sérgio 2', 1968], ['Paulo Sérgio', 'Paulo Sérgio 2', 1968]],
  [['Elizabeth', 'Só Você...', 1974], ['Elizabeth (3)', 'Só Você...', 1974]],
  [['Nicki Minaj', 'Pink Friday (Roman Reloaded)', 2012], ['Nicki Minaj', 'Pink Friday (Roman Reloaded)', 2012]],
  [['Milton Banana Trio', 'Balançando Volume 2', 1966], ['Milton Banana Trio', 'Balançando Volume 2', '']],
  [['Jacob Do Bandolim', 'Os Saraus De Jacob', 1971], ['Jacob Do Bandolim / Paulo Tapajós', 'Os Saraus De Jacob', 1971]],
  [['Various', 'Lambadas Internacionais', 1985], ['Various', 'Lambadas Internacionais', 1985]],
  [['Various', 'O Salvador Da Pátria (Internacional)', ''], ['Various', 'O Salvador Da Pátria (Internacional)', 1989]],
  [['Various', 'Terras do Sem Fim', 1981], ['Various', 'Terras Do Sem Fim', 1981]],
  [['Various', 'O Astro (Trilha Sonora Original da Novela)', 1977], ['Various', 'O Astro (Trilha Sonora Original Da Novela)', 1977]],
  [['Various', 'Eramos Seis', 1977], ['Various', 'Éramos Seis (Trilha Sonora Original Da Novela)', 1977]],
  [['Various', 'Direito de Amar - Nacional', 1987], ['Various', 'Direito De Amar (Nacional)', 1987]],
  [['Various', 'Mandala Nacional', 1987], ['Various', 'Mandala (Nacional)', 1987]],
  [['Various', 'Pedra Sobre Pedra - Volume 2', ''], ['Various', 'Pedra Sobre Pedra - Volume 2', 1992]],
  [['Elis', 'Essa Mulher', ''], ['Elis Regina', 'Elis, Essa Mulher', 1979]],
  [['Elza e Miltinho', 'e Samba', 1967], ['Elza Soares / Miltinho', 'Elza, Miltinho E Samba', 1967]],
  [['Maria Bethânia', 'Drama 3° Ato', ''], ['Maria Bethânia', 'Drama 3º Ato "Luz Da Noite"', 1973]],
  [['Pinduca', 'O Rei Do Carimbó Vol. 13', 1984], ['Pinduca', 'O Rei Do Carimbó Vol. 13', 1984]],
  [['Quarteto Em Cy', 'Antologia do Samba Canção (Vol. 2)', 1976], ['Quarteto Em Cy', 'Antologia Do Samba Canção Vol. 2', 1976]],
  [['Paulinho', 'para animar sua festa', ''], ['Paulinho Magalhães', 'Prestige Apresenta Paulinho Para Animar Sua Festa', '']],
  [['Martinho da Vila', 'Origens / Pelo Telefone', 1974], ['Martinho Da Vila', 'Origens (Pelo Telefone)', 1973]],
  [['Agnaldo Do Amazonas', 'Furacão Do Norte Vol. III', 1987], ['Agnaldo Do Amazonas', 'Furacão Do Norte Vol. III', 1987]],
  [['Caetano*, Bethania*, Gil', 'Caetano, Bethania, Gil - Nº 2', 1973], ['Caetano Veloso / Maria Bethânia / Gilberto Gil', 'Caetano, Bethania, Gil - Nº 2', 1973]],
  [['The Beatles', '1', 2018], ['The Beatles', '1', 2018]],
  [['Francisco, El Hombre', 'Rasgacabeza', 2019], ['Francisco el Hombre', 'Rasgacabeza', 2019]],
  [['The Rolling Stones', "It's Only Rock and Roll", ''], ['The Rolling Stones', "It's Only Rock 'N' Roll (2009 Remaster)", 1974]],
  [['Misfits', 'American Psycho', 1997], ['The Misfits', 'American Psycho', 1997]],
  [['USA for Africa', 'We Are the World', ''], ['U.S.A. for Africa', 'We Are the World', 1985]],
  [['Céu', 'Acústico', 2021], ['Céu', 'Acustico', 2021]],
  [['Jackson Browne', 'Late for the sky', ''], ['Jackson Browne', 'Late For the Sky (Remastered)', 1974]],
  [['Leon Russell', "Will O' The Wisp", ''], ['Leon Russell', "Will o' the Wisp", 1975]],
  // Falsos positivos encontrados na auditoria completa
  [['Y & T', 'Down For The Count', 1985], ['Y & T', 'Down For The Count', 1985]],
  [['Lazy', '宇宙船地球号', 1980], ['Lazy', '宇宙船地球号', 1980]],
  [['Elizeth Cardoso, Zimbo Trio, Jacob Do Bandolim', 'Vol. I', 1970], ['Elizeth Cardoso / Zimbo Trio / Jacob Do Bandolim', 'Vol. I', 1970]],
  [['Woody Shaw', 'Woody Three', 1979], ['Woody Shaw', 'Woody III', 1978]],
  [['Benedito Costa E Seu Cavaquinho', 'Que Delícia... De Lambada!', ''], ['Benedito Costa', 'Que Delícia... De Lambada!', '']],
  [['Os Impossíveis e Os San-Papas', 'Os Sucessos do Momento', 1971], ['San-Papas', 'Os Impossiveis E Os Sucessos Do Momento', 1972]],
  [['Do Sertão para a Cidade', 'Do Sertão para a Cidade', ''], ['Various', 'Do Sertão Para A Cidade', 1976]],
  [['Chico Buarque De Hollanda', 'Ennio Morricone - Per Un Pugno Di Samba', 2010], ['Chico Buarque De Hollanda / Ennio Morricone', 'Per Un Pugno Di Samba', 2010]],
  [['The Very Best of the Rolling Stones', 'Rolled Gold', ''], ['The Rolling Stones', 'Rolled Gold (The Very Best Of The Rolling Stones)', 1975]],
  [['Creedence Clearwater', 'Gold', ''], ['Creedence Clearwater Revival', 'Creedence Gold', 1972]],
];

const CAPAS_ERRADAS = [
  [['Various', 'Vidas - Trilha Sonora Original da Novela', 1971], ['Various', 'Duas Vidas (Trilha Sonora Original Da Novela)', 1977]],
  [['Various', 'Pantanal 2', 1990], ['Various', 'Pantanal', 1990]],
  [['Various', 'Grande Baile Nº 1', 1966], ['Various', 'Grande Baile Nº 4', 1966]],
  [['Various', 'Escrete Do Samba Vol. 3', 1978], ['Various', 'Escrete Do Samba Vol. 4', 1978]],
  [['Carl Perkins', 'The Collection', ''], ['Carl Perkins, Eric Clapton, George Harrison, Ringo Starr & Dave Edmunds', 'Blue Suede Shoes: A Rockabilly Session (Live)', 1986]],
  [['David Lee Roth', 'Skyscrapper (IMP)', ''], ['David Lee Roth', "Eat 'Em and Smile", 1986]],
  [['The Beatles', 'The Beatles In Hamburg', 1975], ['The Beatles Revival Band', '40th Anniversary (Live at the FABRIK in Hamburg)', 2016]],
  [['Dave Mclean', 'For All the Children', ''], ['Backstreet Boys', 'Millennium', 1999]],
  [['Tommy Fortman', 'Demon Thor', ''], ['Demon Thor & Tommy Fortman', 'Anno 1972 - Written in the Sky (2022 Remastered Version)', 2022]],
  [['Willie Nelson & David Allan Coe', 'Outlaws', ''], ['Willie Nelson', 'Greatest Hits (& Some That Will Be)', 1981]],
  [['Adoniran Barbosa', '1980', ''], ['Adoniran Barbosa', 'Relicário: Adoniran Barbosa (ao vivo no Sesc 1980)', 2007]],
  [['The Rolling Stones', 'Gimme Shelter', ''], ['The Rolling Stones', 'Let It Bleed (Remastered 2019)', 1969]],
  [['Best of the Bossa Novas', 'Best of the Bossa Novas', ''], ['Frank Sinatra & Antônio Carlos Jobim', 'Sinatra/Jobim: The Complete Reprise Recordings', 2010]],
  [['Paul Mccartney', 'Spies Like Us', ''], ["Singer's Edge Karaoke", 'Spies Like Us (Originally Performed By Paul McCartney) [Karaoke] - Single', 2017]],
  [['Spin Doctors', 'Spin Doctors', 1991], ['Spin Doctors', 'The Best of Spin Doctors', 2004]],
  [['Country Joe Mcdonald', 'Goodbye Blues', ''], ['Creedence Clearwater Revival', 'Chronicle: The 20 Greatest Hits', 1976]],
  [['Earl Grant', 'The Best Of Earl Grant', 1970], ['Earl Grant', 'The Very Best Of', 2011]],
  [['Various', 'Mandala Nacional', 1987], ['Various', 'Mandala (Internacional)', 1987]],
  [['Fernando Mendes', 'Fernando Mendes', 1981], ['Fernando Mendes', 'Fernando Mendes', 1975]],
  [['Various', 'Pantanal', 1990], ['Tom Jobim', 'Pantanal', 1990]],
  [['Roberto Carlos', 'Roberto Carlos', 1971], ['Roberto Carlos', 'Roberto Carlos', 1972]],
  [['Roberto Carlos', 'Roberto Carlos', ''], ['Roberto Carlos', 'Roberto Carlos', 1972]],
  [['Gal Costa', 'Gal', 1969], ['Gal Costa', 'Gal Tropical', 1979]],
  [['Various', 'Gente Fina', 1989], ['Various', 'Gente Fina (Internacional)', 1990]],
  [['Elizeth Cardoso', 'Vol. I', 1970], ['Elizeth Cardoso', 'Vol. II', 1971]],
  [['Eric Clapton', 'Journey Man', ''], ['Eagles', 'Hotel California', 1976]],
  [['Carly Simon', '(IMP)', ''], ['Carly Simon', 'The Best of Carly Simon', 1975]],
  [['Various', "Love's In The Air 2", ''], ['Shawn Mendes', 'Illuminate (Deluxe)', 2016]],
  [['The Beatles', 'The Beatles In Hamburg', 1968], ['The Beatles Revival Band', '40th Anniversary (Live at the FABRIK in Hamburg)', 2016]],
  [['Various', 'Batucada Fantástica', 1958], ['Various', 'Batucada Fantástica Vol. 2', 1972]],
  [['Various', 'Os Adolescentes (Trilha Sonora Original - Internacional)', 1981], ['Various', 'Os Adolescentes - Trilha Sonora Nacional Novela', 1981]],
];

const asObj = ([artista, titulo, ano]) => ({ artista, titulo, ano });

describe('scoreCandidate', () => {
  it.each(CAPAS_CORRETAS)('aceita capa correta: %j', (item, cand) => {
    const r = scoreCandidate(asObj(item), asObj(cand));
    expect(r.motivo).toBe('ok');
    expect(r.aceito).toBe(true);
  });

  it.each(CAPAS_ERRADAS)('rejeita capa errada: %j', (item, cand) => {
    expect(scoreCandidate(asObj(item), asObj(cand)).aceito).toBe(false);
  });

  it('dá score maior quando o ano bate', () => {
    const item = { artista: 'Maria Bethânia', titulo: 'Mel', ano: 1979 };
    const mesmoAno = scoreCandidate(item, { artista: 'Maria Bethânia', titulo: 'Mel', ano: 1979 });
    const outroAno = scoreCandidate(item, { artista: 'Maria Bethânia', titulo: 'Mel', ano: 2010 });
    expect(mesmoAno.score).toBeGreaterThan(outroAno.score);
  });
});

describe('utilitários de capa', () => {
  it('tokeniza removendo acentos, stop words e convertendo romanos/ordinais', () => {
    expect(tokenize('Furacão Do Norte Vol. III')).toEqual(['furacao', 'norte', '3']);
    expect(tokenize('Grande Baile Nº 1')).toEqual(['grande', 'baile', '1']);
    expect(tokenize('40th Anniversary')).toEqual(['40', 'anniversary']);
  });

  it('reconhece artistas de coletânea', () => {
    expect(isVariousArtist('Vários')).toBe(true);
    expect(isVariousArtist('Various Artists')).toBe(true);
    expect(isVariousArtist('Trilha Sonora Original')).toBe(true);
    expect(isVariousArtist('')).toBe(true);
    expect(isVariousArtist('Caetano Veloso')).toBe(false);
  });

  it('separa artista e título do Discogs', () => {
    expect(parseDiscogsTitle('Marillion - 1982-1992 - A Singles Collection')).toEqual({
      artista: 'Marillion',
      titulo: '1982-1992 - A Singles Collection',
    });
    expect(parseDiscogsTitle('Elizabeth (3) - Só Você...').artista).toBe('Elizabeth');
  });

  it('extrai o release id da URL de imagem do Discogs', () => {
    const url =
      'https://i.discogs.com/_cwgCtQ_pQs7qwAGrPtWQWpYe1dKE5Jvzq5v1_hXtps/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTEzMDc1/ODQtMTY1ODk5NjI3/NS0yMjQ2LmpwZWc.jpeg';
    expect(discogsRefFromImageUrl(url)).toEqual({ tipo: 'release', id: '1307584' });
    expect(discogsRefFromImageUrl('https://is1-ssl.mzstatic.com/x/600x600bb.jpg')).toBe(null);
  });
});
