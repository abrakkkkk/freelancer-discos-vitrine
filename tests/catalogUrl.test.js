import { describe, it, expect } from 'vitest';
import { lerEstadoDaUrl, montarQueryDoEstado, ESTADO_PADRAO } from '../src/utils/catalogUrl';

const ler = (qs) => lerEstadoDaUrl(new URLSearchParams(qs));

describe('filtros do catálogo na URL', () => {
  it('URL sem filtros não define estado (usa o último estado da sessão)', () => {
    expect(ler('')).toBe(null);
    expect(ler('utm_source=instagram')).toBe(null);
  });

  it('ida e volta preserva o estado', () => {
    const estado = { categoria: 'cds', busca: 'chico buarque', loja: 'Loja 2', caixa: 'Caixa 5B', ordenacao: 'preco_desc', pagina: 3 };
    expect(ler(montarQueryDoEstado(estado))).toEqual(estado);
  });

  it('estado padrão gera URL limpa', () => {
    expect(montarQueryDoEstado(ESTADO_PADRAO)).toBe('');
  });

  it('valores inválidos voltam ao padrão', () => {
    expect(ler('categoria=livros&loja=Loja%209&ordem=deletado&pagina=-4')).toEqual({ ...ESTADO_PADRAO });
    expect(ler('pagina=abc').pagina).toBe(1);
  });

  it('DVD/VHS não ordena por artista', () => {
    expect(ler('categoria=dvds&ordem=artista_asc').ordenacao).toBe('titulo_asc');
  });

  it('limita o tamanho da busca', () => {
    expect(ler(`busca=${'a'.repeat(300)}`).busca).toHaveLength(100);
  });
});
