import { describe, expect, it } from 'vitest';
import { GENEROS, ehNacional, fracaoPortugues, generosDoDisco, generosDoItem, traduzirGeneros } from '@/utils/generos';

describe('GENEROS', () => {
  it('ids únicos, nome e descrição em todos', () => {
    expect(GENEROS.length).toBeGreaterThan(30);
    expect(new Set(GENEROS.map((g) => g.id)).size).toBe(GENEROS.length);
    expect(GENEROS.every((g) => g.nome && g.descricao)).toBe(true);
  });

  it('nenhum gênero junta dois em um nome', () => {
    expect(GENEROS.filter((g) => /,| e /.test(g.nome) && !['metal', 'orquestras'].includes(g.id)).map((g) => g.nome)).toEqual([]);
  });
});

describe('traduzirGeneros: um gênero por disco', () => {
  const t = (genres, styles, nacional = false) => traduzirGeneros({ genres, styles }, { nacional });

  it('sempre no máximo um gênero', () => {
    expect(t(['Latin', 'Pop'], ['MPB', 'Samba', 'Bossa Nova'], true)).toHaveLength(1);
    expect(t(['Jazz', 'Funk / Soul'], ['Jazz-Funk'])).toHaveLength(1);
  });

  it('o estilo mais específico decide: samba vence MPB, pagode vence samba', () => {
    expect(t(['Latin'], ['MPB', 'Samba'], true)).toEqual(['samba']);
    expect(t(['Latin'], ['Samba', 'Pagode'], true)).toEqual(['pagode']);
    expect(t(['Latin'], ['MPB'], true)).toEqual(['mpb']);
  });

  it('forró, sertanejo, regional e axé ficam separados', () => {
    expect(t(['Latin'], ['Forró'], true)).toEqual(['forro']);
    expect(t(['Latin'], ['Baião'], true)).toEqual(['forro']);
    expect(t(['Latin', 'Folk, World, & Country'], ['Caipira'], true)).toEqual(['sertanejo']);
    expect(t(['Latin'], ['Frevo'], true)).toEqual(['regional']);
    expect(t(['Latin'], ['Axé'], true)).toEqual(['axe']);
  });

  it('carimbó e lambada separados; cumbia brasileira é lambada', () => {
    expect(t(['Latin'], ['Carimbó'], true)).toEqual(['carimbo']);
    expect(t(['Latin'], ['Lambada'], true)).toEqual(['lambada']);
    expect(t(['Latin'], ['Cumbia'], true)).toEqual(['lambada']);
  });

  it('romântica e brega separados', () => {
    expect(t(['Latin'], ['Brega'], true)).toEqual(['brega']);
    expect(t(['Latin'], ['Seresta'], true)).toEqual(['romantica']);
    expect(t(['Latin'], ['Bolero'], true)).toEqual(['romantica']);
    expect(t(['Latin'], ['Ballad'], true)).toEqual(['romantica']);
  });

  it('soul, funk, rap e disco separados', () => {
    expect(t(['Funk / Soul'], ['Soul'])).toEqual(['soul']);
    expect(t(['Funk / Soul'], ['Funk'])).toEqual(['funk']);
    expect(t(['Hip Hop'], [])).toEqual(['rap']);
    expect(t(['Funk / Soul'], ['Disco'])).toEqual(['disco']);
    expect(t(['Electronic'], ['Favela Funk'], true)).toEqual(['funk']);
  });

  it('jazz e blues separados', () => {
    expect(t(['Jazz'], ['Bop'])).toEqual(['jazz']);
    expect(t(['Blues'], ['Chicago Blues'])).toEqual(['blues']);
  });

  it('trilhas, infantil e outros separados', () => {
    expect(t(['Stage & Screen'], ['Soundtrack'])).toEqual(['trilhas']);
    expect(t(["Children's"], [])).toEqual(['infantil']);
    expect(t(['Non-Music'], ['Interview'])).toEqual(['outros']);
  });

  it('rock nacional e internacional', () => {
    expect(t(['Rock'], ['New Wave', 'Post-Punk'], true)).toEqual(['rock-nacional']);
    expect(t(['Rock'], ['Classic Rock'], false)).toEqual(['rock']);
  });

  it('progressivo, hard rock e metal, rock and roll e jovem guarda separados', () => {
    expect(t(['Rock'], ['Prog Rock', 'Classic Rock'])).toEqual(['rock-progressivo']);
    expect(t(['Rock'], ['Heavy Metal'])).toEqual(['metal']);
    expect(t(['Rock'], ['Hard Rock'])).toEqual(['metal']);
    expect(t(['Rock'], ['Rockabilly'])).toEqual(['rock-and-roll']);
    expect(t(['Latin'], ['Jovem Guarda'], true)).toEqual(['jovem-guarda']);
    expect(t(['Pop'], ['Easy Listening'])).toEqual(['orquestras']);
    expect(t(['Latin'], ['Easy Listening'], true)).toEqual(['romantica']);
  });

  it('Umbanda e Candomblé vão para Afro-brasileira, não para Gospel', () => {
    expect(t(['Latin'], ['Batucada', 'Religious'], true)).toEqual(['afro-brasileira']);
    expect(t(['Latin'], ['African', 'Batucada', 'Religious'], true)).toEqual(['afro-brasileira']);
    expect(t(['Latin'], ['Religious'], true)).toEqual(['gospel']);
    expect(t(['Funk / Soul'], ['Gospel'])).toEqual(['gospel']);
  });

  it('country é Country; folk de fora é Folk; raiz de fora é Latina e Mundo', () => {
    expect(t(['Folk, World, & Country'], ['Country'])).toEqual(['country']);
    expect(t(['Folk, World, & Country'], ['Country', 'Gospel'])).toEqual(['gospel']);
    expect(t(['Folk, World, & Country'], ['Folk'])).toEqual(['folk']);
    expect(t(['Latin', 'Folk, World, & Country'], ['Tango'])).toEqual(['latina']);
    expect(t(['Folk, World, & Country'], [])).toEqual(['mundo']);
    expect(t(['Folk, World, & Country'], ['Fado'])).toEqual(['mundo']);
  });

  it('regional é só do Brasil', () => {
    expect(t(['Latin', 'Folk, World, & Country'], ['Folk'], true)).toEqual(['regional']);
    expect(t(['Folk, World, & Country'], [], true)).toEqual(['regional']);
  });

  it('Latin sem estilo fica sem gênero', () => {
    expect(t(['Latin'], [], true)).toEqual([]);
  });
});

describe('ehNacional', () => {
  it('Latin decide, a não ser com estilo de fora', () => {
    expect(ehNacional({ genres: ['Latin'] })).toBe(true);
    expect(ehNacional({ genres: ['Latin'], styles: ['Tango'] })).toBe(false);
    expect(ehNacional({ genres: ['Latin'], styles: ['Bolero'] })).toBe(true);
  });

  it('títulos em português', () => {
    expect(ehNacional({ genres: ['Rock'] }, ['Carne Humana', 'Agora Eu Sei', 'Heroína', 'Quem Você Pensa Que É'])).toBe(true);
    expect(ehNacional({ genres: ['Rock'] }, ['Razamanaz', 'Alcatraz', 'Woke Up This Morning', 'Night Woman'])).toBe(false);
  });

  it('sem faixas e sem Latin não decide', () => {
    expect(ehNacional({ genres: ['Rock'] }, [])).toBe(null);
  });

  it('fracaoPortugues ignora títulos vazios', () => {
    expect(fracaoPortugues(['Coração', '', null])).toBe(1);
  });
});

describe('generosDoItem', () => {
  it('ignora códigos desconhecidos (como os antigos) e mantém a ordem', () => {
    expect(generosDoItem({ generos: ['samba', 'samba-pagode', 'mpb'] }).map((g) => g.id)).toEqual(['samba', 'mpb']);
    expect(generosDoItem({ generos: null })).toEqual([]);
  });
});

describe('generosDoDisco', () => {
  it('sem dados do Discogs, sem gênero', () => {
    expect(generosDoDisco(null)).toEqual([]);
    expect(generosDoDisco({ genres: [], styles: [] })).toEqual([]);
  });

  it('sem faixas, o artista decide se o rock é nacional', () => {
    expect(generosDoDisco({ genres: ['Rock'], styles: ['Pop Rock'] }, [], true)).toEqual(['rock-nacional']);
    expect(generosDoDisco({ genres: ['Rock'], styles: ['Pop Rock'] }, [])).toEqual(['rock']);
  });
});
