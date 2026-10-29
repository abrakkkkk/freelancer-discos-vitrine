import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase simulado que registra as colunas passadas para .order().
const ordenacoes = [];
const supabaseFalso = {
  from: () => {
    const q = {
      select: () => q,
      eq: () => q,
      in: () => q,
      or: () => q,
      ilike: () => q,
      limit: () => q,
      range: () => q,
      order: (coluna) => (ordenacoes.push(coluna), q),
      then: (resolve) => resolve({ data: [], count: 0, error: null }),
    };
    return q;
  },
};

vi.mock('@/lib/supabaseServer', () => ({
  get supabaseServer() {
    return supabaseFalso;
  },
}));

const { catalogService } = await import('../src/services/catalogService');

describe('ordenação do catálogo', () => {
  beforeEach(() => {
    ordenacoes.length = 0;
  });

  it('aceita colunas permitidas', async () => {
    await catalogService.fetchItems('discos', { pagina: 7, ordenarColuna: 'preco', ordenarDirecao: 'desc' });
    expect(ordenacoes).toEqual(['preco']);
  });

  it('ignora coluna fora da lista e usa a ordenação padrão', async () => {
    await catalogService.fetchItems('discos', { pagina: 8, ordenarColuna: 'deletado', ordenarDirecao: 'asc' });
    expect(ordenacoes).not.toContain('deletado');
    expect(ordenacoes).toEqual(['caixa', 'artista', 'titulo']);
  });

  it('ignora direção inválida', async () => {
    await catalogService.fetchItems('discos', { pagina: 9, ordenarColuna: 'preco', ordenarDirecao: 'x' });
    expect(ordenacoes).not.toContain('preco');
  });
});
