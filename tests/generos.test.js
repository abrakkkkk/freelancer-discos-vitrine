import { describe, expect, it } from 'vitest';
import { GENEROS, ehNacional, fracaoPortugues, generosDoItem, traduzirGeneros } from '@/utils/generos';

describe('GENEROS', () => {
  it('tem 17 gêneros, ids únicos e descrição em todos', () => {
    expect(GENEROS).toHaveLength(17);
    expect(new Set(GENEROS.map((g) => g.id)).size).toBe(17);
    expect(GENEROS.every((g) => g.nome && g.descricao)).toBe(true);
  });
});

describe('traduzirGeneros', () => {
  const t = (genres, styles, nacional = false) => traduzirGeneros({ genres, styles }, { nacional });

  it('Latin com estilo MPB vira MPB', () => {
    expect(t(['Latin'], ['MPB'], true)).toEqual(['mpb']);
  });

  it('estilo vem antes do gênero e o limite é 2', () => {
    expect(t(['Latin', 'Pop'], ['MPB', 'Samba', 'Bossa Nova'], true)).toEqual(['mpb', 'samba-pagode']);
  });

  it('Bossanova e Bossa Nova são o mesmo gênero', () => {
    expect(t(['Latin'], ['Samba-Canção', 'Bossanova'], true)).toEqual(['samba-pagode', 'bossa-nova']);
  });

  it('rock nacional e internacional pelo indicador de nacional', () => {
    expect(t(['Rock'], ['New Wave', 'Post-Punk'], true)).toEqual(['rock-nacional']);
    expect(t(['Rock'], ['Hard Rock'], false)).toEqual(['rock']);
  });

  it('balada romântica só conta em disco nacional ou latino', () => {
    expect(t(['Latin'], ['Ballad'], false)).toEqual(['romantica-brega']);
    expect(t(['Pop'], ['Ballad'], false)).toEqual(['pop']);
  });

  it('Latin sem estilo conhecido fica sem gênero', () => {
    expect(t(['Latin'], [], true)).toEqual([]);
  });

  it('jazz-funk vira jazz e soul', () => {
    expect(t(['Jazz', 'Funk / Soul'], ['Jazz-Funk'])).toEqual(['jazz-blues', 'soul-funk-rap']);
  });

  it('entrevista e trilha vão para outros', () => {
    expect(t(['Non-Music'], ['Interview'])).toEqual(['trilhas-outros']);
  });

  it('folk só vira regional quando é nacional', () => {
    expect(t(['Folk, World, & Country'], ['Caipira'], true)).toEqual(['sertanejo-forro']);
    expect(t(['Folk, World, & Country'], ['Country'], false)).toEqual(['trilhas-outros']);
  });
});

describe('ehNacional', () => {
  it('Latin decide sozinho', () => {
    expect(ehNacional({ genres: ['Latin'] })).toBe(true);
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
  it('ignora códigos desconhecidos e mantém a ordem', () => {
    expect(generosDoItem({ generos: ['samba-pagode', 'xyz', 'mpb'] }).map((g) => g.id)).toEqual(['samba-pagode', 'mpb']);
    expect(generosDoItem({ generos: null })).toEqual([]);
  });
});

describe('generosDoDisco', () => {
  it('sem dados do Discogs, sem gênero', async () => {
    const { generosDoDisco } = await import('@/utils/generos');
    expect(generosDoDisco(null)).toEqual([]);
    expect(generosDoDisco({ genres: [], styles: [] })).toEqual([]);
  });

  it('sem faixas, o artista decide se o rock é nacional', async () => {
    const { generosDoDisco } = await import('@/utils/generos');
    expect(generosDoDisco({ genres: ['Rock'], styles: ['Pop Rock'] }, [], true)).toEqual(['rock-nacional']);
    expect(generosDoDisco({ genres: ['Rock'], styles: ['Pop Rock'] }, [])).toEqual(['rock']);
  });

  it('carimbó, lambada e cumbia vão para Carimbó e Lambada, não para sertanejo', () => {
    const latinFolk = ['Latin', 'Folk, World, & Country'];
    expect(traduzirGeneros({ genres: latinFolk, styles: ['Carimbó'] }, { nacional: true })).toEqual(['carimbo-lambada']);
    expect(traduzirGeneros({ genres: ['Latin'], styles: ['Cumbia', 'Lambada'] }, { nacional: true })).toEqual(['carimbo-lambada']);
  });

  it('seresta, batucada, marcha carnavalesca e favela funk têm gênero', () => {
    expect(traduzirGeneros({ genres: ['Latin'], styles: ['Seresta'] }, { nacional: true })).toEqual(['romantica-brega']);
    expect(traduzirGeneros({ genres: ['Latin'], styles: ['Batucada'] }, { nacional: true })).toEqual(['samba-pagode']);
    expect(traduzirGeneros({ genres: ['Latin'], styles: ['Marcha Carnavalesca'] }, { nacional: true })).toEqual(['samba-pagode']);
    expect(traduzirGeneros({ genres: ['Electronic'], styles: ['Favela Funk'] }, { nacional: true })).toEqual(['soul-funk-rap']);
  });

  it('tango e outros estilos de fora não viram sertanejo pelo "Folk" amplo', () => {
    const latinFolk = ['Latin', 'Folk, World, & Country'];
    expect(traduzirGeneros({ genres: latinFolk, styles: ['Tango', 'Milonga'] }, { nacional: true })).toEqual(['trilhas-outros']);
    expect(traduzirGeneros({ genres: ['Latin'], styles: ['Tango'] }, { nacional: true })).toEqual(['trilhas-outros']);
    expect(traduzirGeneros({ genres: latinFolk, styles: ['Folk'] }, { nacional: true })).toEqual(['sertanejo-forro']);
    expect(traduzirGeneros({ genres: latinFolk, styles: [] }, { nacional: true })).toEqual(['sertanejo-forro']);
  });

  it('folk de fora vai para Folk; o resto da música de raiz de fora, para Trilhas e outros', () => {
    const folk = ['Folk, World, & Country'];
    expect(traduzirGeneros({ genres: folk, styles: ['Folk'] }, { nacional: false })).toEqual(['folk']);
    expect(traduzirGeneros({ genres: folk, styles: ['Country'] }, { nacional: false })).toEqual(['trilhas-outros']);
    expect(traduzirGeneros({ genres: folk, styles: [] }, { nacional: false })).toEqual(['trilhas-outros']);
    expect(traduzirGeneros({ genres: folk, styles: ['Fado'] }, { nacional: false })).toEqual(['trilhas-outros']);
    // Folk brasileiro continua regional, e o gênero amplo não soma um segundo gênero.
    expect(traduzirGeneros({ genres: ['Latin', ...folk], styles: ['Folk'] }, { nacional: true })).toEqual(['sertanejo-forro']);
    expect(traduzirGeneros({ genres: ['Rock', ...folk], styles: [] }, { nacional: false })).toEqual(['rock']);
  });
});
