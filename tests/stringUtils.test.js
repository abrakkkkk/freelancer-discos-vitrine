import { describe, it, expect } from 'vitest';
import { removeAcentos, formatCaixa, extractSearchTokens, extractRecordLabel } from '../src/utils/stringUtils';

describe('stringUtils', () => {
  it('remove acentos corretamente', () => {
    expect(removeAcentos('Álbum Clássico')).toBe('album classico');
    expect(removeAcentos('Época de Ouro')).toBe('epoca de ouro');
  });

  it('formata caixas da Loja 1 e Loja 2', () => {
    expect(formatCaixa('5', 'Loja 1')).toBe('Caixa 5');
    expect(formatCaixa('5b', 'Loja 2')).toBe('Caixa 5B');
    expect(formatCaixa('Caixa 10b', 'Loja 2')).toBe('Caixa 10B');
    expect(formatCaixa('', 'Loja 1')).toBe('—');
  });

  it('extrai tokens de busca removendo stop words', () => {
    const { effectiveWords } = extractSearchTokens('The Beatles Abbey Road');
    expect(effectiveWords).toContain('beatles');
    expect(effectiveWords).toContain('abbey');
    expect(effectiveWords).toContain('road');
    expect(effectiveWords).not.toContain('the');
  });

  it('extrai gravadora / selo (label) de observações com colchetes', () => {
    expect(extractRecordLabel('[Philips • 1976]')).toBe('Philips');
    expect(extractRecordLabel('[Copacabana • 1983]')).toBe('Copacabana');
    expect(extractRecordLabel('[A&M Records • 1980] Importado')).toBe('A&M Records');
    expect(extractRecordLabel('[Polydisc]')).toBe('Polydisc');
    expect(extractRecordLabel('[1992]')).toBe(null);
    expect(extractRecordLabel('Apenas observação sem colchetes')).toBe(null);
    expect(extractRecordLabel('')).toBe(null);
  });
});
