import { describe, expect, it } from 'vitest';
import {
  GENEROS,
  SO_BRASILEIROS,
  SO_DE_FORA,
  ehNacional,
  fracaoPortugues,
  generoMaisComum,
  generoNaOrigem,
  montarGeneros,
  generosDoDisco,
  generosDoItem,
  nacionalPeloGenero,
  traduzirGeneros,
} from '@/utils/generos';

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

describe('traduzirGeneros: o principal primeiro, depois os outros estilos claros', () => {
  const t = (genres, styles, nacional = false) => traduzirGeneros({ genres, styles }, { nacional });

  it('disco de sertanejo com forró fica nos dois', () => {
    expect(t(['Latin'], ['Sertanejo', 'Forró'], true)).toEqual(['sertanejo', 'forro']);
    expect(t(['Latin', 'Pop'], ['MPB', 'Samba', 'Bossa Nova'], true)).toEqual(['samba', 'bossa-nova']);
    expect(t(['Funk / Soul'], ['Soul', 'Disco'])).toEqual(['soul', 'disco']);
  });

  it('estilo amplo (peso 1) não vira gênero extra', () => {
    expect(t(['Latin'], ['MPB', 'Samba'], true)).toEqual(['samba']);
    expect(t(['Rock', 'Pop'], ['Prog Rock', 'Pop Rock'])).toEqual(['rock-progressivo']);
    expect(t(['Funk / Soul'], ['Soul', 'Rhythm & Blues'])).toEqual(['soul']);
  });

  it('o estilo mais específico decide o principal: samba vence MPB, pagode vence samba', () => {
    expect(t(['Latin'], ['MPB', 'Samba'], true)).toEqual(['samba']);
    expect(t(['Latin'], ['Samba', 'Pagode'], true)).toEqual(['pagode', 'samba']);
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
  });

  it('funk e rap brasileiros separados dos de fora', () => {
    expect(t(['Electronic'], ['Favela Funk'], true)).toEqual(['funk-brasileiro']);
    expect(t(['Funk / Soul'], ['Funk'], true)).toEqual(['funk-brasileiro']);
    expect(t(['Hip Hop'], [], true)).toEqual(['rap-nacional']);
    expect(t(['Hip Hop'], ['Conscious'], true)).toEqual(['rap-nacional']);
    expect(t(['Funk / Soul', 'Latin'], ['Soul', 'Funk'], true)).toEqual(['soul', 'funk-brasileiro']);
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
    expect(t(['Folk, World, & Country'], ['Country', 'Gospel'])).toEqual(['gospel', 'country']);
    expect(t(['Folk, World, & Country'], ['Folk'])).toEqual(['folk']);
    expect(t(['Latin', 'Folk, World, & Country'], ['Tango'])).toEqual(['latina']);
    expect(t(['Folk, World, & Country'], [])).toEqual(['mundo']);
    expect(t(['Folk, World, & Country'], ['Fado'])).toEqual(['mundo']);
  });

  it('regional é só do Brasil', () => {
    expect(t(['Latin', 'Folk, World, & Country'], ['Folk'], true)).toEqual(['regional']);
    expect(t(['Folk, World, & Country'], [], true)).toEqual(['regional']);
    expect(t(['Folk, World, & Country'], [])).toEqual(['mundo']);
    expect(generoNaOrigem('regional', false)).toBe(null);
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

describe('gêneros brasileiros e de fora', () => {
  it('todo gênero dos dois lados existe e nenhum está nos dois', () => {
    const ids = new Set(GENEROS.map((g) => g.id));
    expect([...SO_BRASILEIROS, ...SO_DE_FORA].every((id) => ids.has(id))).toBe(true);
    expect([...SO_BRASILEIROS].filter((id) => SO_DE_FORA.has(id))).toEqual([]);
  });

  it('generoNaOrigem troca o par conforme o disco', () => {
    expect(generoNaOrigem('funk', true)).toBe('funk-brasileiro');
    expect(generoNaOrigem('funk-brasileiro', false)).toBe('funk');
    expect(generoNaOrigem('rap', true)).toBe('rap-nacional');
    expect(generoNaOrigem('rock-nacional', false)).toBe('rock');
    expect(generoNaOrigem('soul', true)).toBe('soul');
  });

  it('nacionalPeloGenero: o principal decide quando só existe de um lado', () => {
    expect(nacionalPeloGenero('samba', false)).toBe(true);
    expect(nacionalPeloGenero('rock', true)).toBe(false);
    expect(nacionalPeloGenero('soul', true)).toBe(true);
  });
});

describe('montarGeneros: a regra do script e do cadastro pelo estoque', () => {
  it('sem gênero identificado, vai para Outros', () => {
    expect(montarGeneros({ principal: null })).toEqual(['outros']);
  });

  it('principal primeiro e extras sem repetir; Outros sai quando há gênero melhor', () => {
    expect(montarGeneros({ principal: 'sertanejo', extras: ['forro', 'sertanejo'], nacional: true })).toEqual(['sertanejo', 'forro']);
    expect(montarGeneros({ principal: 'outros', extras: ['forro'], nacional: true })).toEqual(['forro']);
  });

  it('disco de fora não fica em gênero brasileiro de par, nem em Regional', () => {
    expect(montarGeneros({ principal: 'country', extras: ['sertanejo'], origem: 'fora' })).toEqual(['country']);
    expect(montarGeneros({ principal: 'regional', origem: 'fora' })).toEqual(['mundo']);
    expect(montarGeneros({ principal: 'funk', origem: 'br' })).toEqual(['funk-brasileiro']);
  });

  it('coletânea fica com dois gêneros', () => {
    expect(montarGeneros({ principal: 'trilhas', extras: ['disco', 'funk', 'soul'], coletanea: true })).toEqual(['trilhas', 'disco']);
  });

  it('generoMaisComum: o principal mais frequente do artista, sem Outros nem empate', () => {
    expect(generoMaisComum([['brega'], ['brega', 'samba'], ['mpb']])).toBe('brega');
    expect(generoMaisComum([['brega'], ['mpb']])).toBe(null);
    expect(generoMaisComum([['outros'], ['outros']])).toBe(null);
  });
});
