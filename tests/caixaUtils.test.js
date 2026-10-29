import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabaseServer', () => ({ supabaseServer: null }));

import { chaveCaixa, lojaPelaCaixa, variantesCaixa } from '../src/utils/caixaUtils';
import { aplicarFiltroCaixaNaQuery } from '../src/services/catalogService';

// Query falsa que só registra as chamadas encadeadas.
function queryFalsa() {
  const chamadas = [];
  const q = {
    chamadas,
    in: (...args) => (chamadas.push(['in', ...args]), q),
    eq: (...args) => (chamadas.push(['eq', ...args]), q),
    or: (...args) => (chamadas.push(['or', ...args]), q),
  };
  return q;
}

describe('chaveCaixa', () => {
  it('normaliza caixas da Loja 1 para o número', () => {
    expect(chaveCaixa('5', 'Loja 1')).toBe('5');
    expect(chaveCaixa('Caixa 5', 'Loja 1')).toBe('5');
  });

  it('normaliza caixas da Loja 2 para "Caixa NB", inclusive número puro', () => {
    expect(chaveCaixa('Caixa 5B', 'Loja 2')).toBe('Caixa 5B');
    expect(chaveCaixa('5b', 'Loja 2')).toBe('Caixa 5B');
    expect(chaveCaixa('5', 'Loja 2')).toBe('Caixa 5B');
    expect(chaveCaixa('Painel 2', 'Loja 2')).toBe('Painel 2');
  });
});

describe('variantesCaixa é o inverso de chaveCaixa', () => {
  const casos = [
    ['Loja 1', '5', ['5', 'Caixa 5']],
    ['Loja 2', 'Caixa 5B', ['Caixa 5B', '5b', '5', 'Caixa 5']],
    ['Loja 2', 'Painel 2', ['Painel 2']],
  ];
  it.each(casos)('%s / %s', (loja, chave, valoresGravados) => {
    const variantes = variantesCaixa(chave, loja);
    for (const v of valoresGravados) {
      expect(chaveCaixa(v, loja)).toBe(chave);
      expect(variantes).toContain(v);
    }
  });

  it('caixa numérica da Loja 1 não inclui a caixa B da Loja 2', () => {
    expect(variantesCaixa('5', 'Loja 1')).not.toContain('Caixa 5B');
  });
});

describe('aplicarFiltroCaixaNaQuery', () => {
  it('"Caixa 5" sem loja filtra só a Loja 1 (antes misturava a Caixa 5B da Loja 2)', () => {
    const q = aplicarFiltroCaixaNaQuery(queryFalsa(), '5', '');
    expect(q.chamadas).toEqual([
      ['in', 'caixa', ['5', 'Caixa 5']],
      ['or', 'loja.is.null,loja.neq."Loja 2"'],
    ]);
  });

  it('"Caixa 5B" sem loja filtra só a Loja 2', () => {
    const q = aplicarFiltroCaixaNaQuery(queryFalsa(), 'Caixa 5B', '');
    expect(q.chamadas[0][2]).toContain('Caixa 5B');
    expect(q.chamadas[1]).toEqual(['eq', 'loja', 'Loja 2']);
  });

  it('na página da Loja 2 inclui número puro, igual à contagem', () => {
    const q = aplicarFiltroCaixaNaQuery(queryFalsa(), 'Caixa 5B', 'Loja 2');
    expect(q.chamadas).toHaveLength(1);
    expect(q.chamadas[0][2]).toEqual(expect.arrayContaining(['Caixa 5B', '5']));
  });

  it('sem caixa não altera a query', () => {
    const q = queryFalsa();
    expect(aplicarFiltroCaixaNaQuery(q, '', '').chamadas).toEqual([]);
  });

  it('lojaPelaCaixa reconhece o formato', () => {
    expect(lojaPelaCaixa('12')).toBe('Loja 1');
    expect(lojaPelaCaixa('Caixa 12B')).toBe('Loja 2');
    expect(lojaPelaCaixa('Painel 2')).toBe(null);
  });
});
