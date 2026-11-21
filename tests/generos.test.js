import { describe, expect, it } from 'vitest';
import { GENEROS, ehNacional, fracaoPortugues, generosDoItem, traduzirGeneros } from '@/utils/generos';

describe('GENEROS', () => {
  it('tem 15 gêneros, ids únicos e descrição em todos', () => {
    expect(GENEROS).toHaveLength(15);
    expect(new Set(GENEROS.map((g) => g.id)).size).toBe(15);
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
    expect(t(['Folk, World, & Country'], ['Country'], false)).toEqual([]);
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
});
