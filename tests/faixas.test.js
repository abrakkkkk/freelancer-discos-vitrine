import { describe, expect, it } from 'vitest';
import { agruparPorLado, faixasDoItem } from '@/utils/faixas';

describe('agruparPorLado', () => {
  it('separa Lado A e Lado B e numera dentro de cada lado', () => {
    const grupos = agruparPorLado([
      { posicao: 'A1', titulo: 'Um' },
      { posicao: 'A2', titulo: 'Dois' },
      { posicao: 'B1', titulo: 'Três' },
    ]);
    expect(grupos.map((g) => g.lado)).toEqual(['A', 'B']);
    expect(grupos[1].faixas[0].numero).toBe('1');
  });

  it('lado sem número na posição ("B") recebe o número pela ordem', () => {
    const grupos = agruparPorLado([
      { posicao: 'A1', titulo: 'Um' },
      { posicao: 'B', titulo: 'Dois' },
    ]);
    expect(grupos[1].faixas[0].numero).toBe('1');
  });

  it('CD sem lados vira um grupo só, sem nome', () => {
    const grupos = agruparPorLado([
      { posicao: '1', titulo: 'Um' },
      { posicao: '2', titulo: 'Dois' },
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].lado).toBe('');
  });
});

describe('faixasDoItem', () => {
  it('ignora disco não procurado ou sem faixas encontradas', () => {
    expect(faixasDoItem({ faixas: null })).toBeNull();
    expect(faixasDoItem({ faixas: { faixas: [] } })).toBeNull();
    expect(faixasDoItem({ faixas: { faixas: [{ titulo: 'Um' }], fonte: 'x' } })?.fonte).toBe('x');
  });
});
