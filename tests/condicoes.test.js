import { describe, expect, it } from 'vitest';
import { seloDoItem } from '@/utils/condicoes';

describe('seloDoItem: um selo só por disco', () => {
  it('condição marcada vira o selo', () => {
    expect(seloDoItem({ condicoes: ['capa_pirata'] })).toBe('Capa Pirata');
    expect(seloDoItem({ condicoes: ['disco_empenado'] })).toBe('Disco Empenado');
  });

  it('com várias condições, vale a primeira na ordem do estoque', () => {
    expect(seloDoItem({ condicoes: ['midia_avariada', 'capa_avariada'] })).toBe('Capa Avariada');
  });

  it('a condição vence o importado', () => {
    expect(seloDoItem({ condicoes: ['capa_pirata'], observacao: 'Importado' })).toBe('Capa Pirata');
  });

  it('sem condição, importado; sem nada, nenhum selo', () => {
    expect(seloDoItem({ condicoes: null, observacao: '[EMI] Importado' })).toBe('Importado');
    expect(seloDoItem({ condicoes: ['codigo_antigo'] })).toBe(null);
    expect(seloDoItem({})).toBe(null);
  });
});
