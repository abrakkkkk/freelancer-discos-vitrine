import { describe, expect, it } from 'vitest';
import { agruparPorLado, faixasDoItem } from '@/utils/faixas';

const f = (posicao) => ({ posicao, titulo: posicao });
const nomes = (grupos) => grupos.map((g) => g.nome);

describe('agruparPorLado', () => {
  it('vinil: separa Lado A e Lado B e numera dentro de cada lado', () => {
    const grupos = agruparPorLado([f('A1'), f('A2'), f('B1')]);
    expect(nomes(grupos)).toEqual(['Lado A', 'Lado B']);
    expect(grupos[1].faixas[0].numero).toBe('1');
  });

  it('LP duplo: quatro lados', () => {
    expect(nomes(agruparPorLado([f('A1'), f('B1'), f('C1'), f('D1')]))).toEqual(['Lado A', 'Lado B', 'Lado C', 'Lado D']);
  });

  it('lado sem número na posição ("B") recebe o número pela ordem', () => {
    const grupos = agruparPorLado([f('A1'), f('B')]);
    expect(grupos[1].faixas[0].numero).toBe('1');
  });

  it('CD: um grupo só, sem nome', () => {
    const grupos = agruparPorLado([f('1'), f('2'), f('3')]);
    expect(nomes(grupos)).toEqual(['']);
    expect(grupos[0].faixas.map((x) => x.numero)).toEqual(['1', '2', '3']);
  });

  it('CD duplo: Disco 1 e Disco 2, numerando dentro de cada um', () => {
    const grupos = agruparPorLado([f('1-1'), f('1-2'), f('2-1')]);
    expect(nomes(grupos)).toEqual(['Disco 1', 'Disco 2']);
    expect(grupos[1].faixas[0].numero).toBe('1');
  });

  it('vinil de um lado só: sem título', () => {
    expect(nomes(agruparPorLado([f('A1'), f('A2')]))).toEqual(['']);
  });
});

describe('faixasDoItem', () => {
  it('ignora disco não procurado ou sem faixas encontradas', () => {
    expect(faixasDoItem({ faixas: null })).toBeNull();
    expect(faixasDoItem({ faixas: { faixas: [] } })).toBeNull();
    expect(faixasDoItem({ faixas: { faixas: [{ titulo: 'Um' }], fonte: 'x' } })?.fonte).toBe('x');
  });
});
