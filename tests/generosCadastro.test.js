import { describe, it, expect, vi, beforeEach } from 'vitest';

// Disco salvo no estoque: a vitrine dá gênero mesmo sem o Discogs (artista ou "Outros").
// Supabase simulado: a leitura dos discos avisados, a dos outros discos dos artistas e as gravações.
let discosAvisados = [];
let discosDosArtistas = [];
const gravados = [];

const consulta = () => {
  const q = { filtros: [], atualizacao: null };
  q.select = () => q;
  q.update = (valor) => ((q.atualizacao = valor), q);
  q.in = (coluna, valores) => (q.filtros.push(['in', coluna, valores]), q);
  q.eq = (coluna, valor) => (q.filtros.push(['eq', coluna, valor]), q);
  q.is = () => q;
  q.not = () => q;
  q.then = (resolve) => {
    if (q.atualizacao) {
      gravados.push({ id: q.filtros.find(([, c]) => c === 'id')[2], ...q.atualizacao });
      return resolve({ error: null });
    }
    const porArtista = q.filtros.some(([, c]) => c === 'artista');
    return resolve({ data: porArtista ? discosDosArtistas : discosAvisados, error: null });
  };
  return q;
};

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@/lib/supabaseServer', () => ({ supabaseServer: { from: () => consulta() } }));
vi.mock('@/utils/faixasDiscogs', () => ({
  headersDiscogs: () => null,
  buscarFaixasDoDisco: vi.fn(),
  buscarLancamentoParaGenero: vi.fn(),
  generoParaGravar: (x) => x,
  valorParaGravar: (x) => x,
}));

const { preencherFaixasDosDiscos } = await import('../src/services/faixasService.js');

const disco = (id, artista, extra = {}) => ({ id, artista, titulo: 'T', faixas: null, genero_discogs: null, generos: null, ...extra });

describe('gênero do disco salvo no estoque', () => {
  beforeEach(() => {
    gravados.length = 0;
    discosDosArtistas = [];
  });

  it('herda o gênero principal dos outros discos do artista', async () => {
    discosAvisados = [disco(1, 'Odair José')];
    discosDosArtistas = [
      { artista: 'Odair José', generos: ['brega'] },
      { artista: 'Odair José', generos: ['brega', 'romantica'] },
      { artista: 'Odair José', generos: ['mpb'] },
    ];
    await preencherFaixasDosDiscos([1]);
    expect(gravados).toEqual([{ id: 1, generos: ['brega'] }]);
  });

  it('sem Discogs e sem artista conhecido, vai para Outros', async () => {
    discosAvisados = [disco(2, 'Artista Desconhecido'), disco(3, 'Various')];
    await preencherFaixasDosDiscos([2, 3]);
    expect(gravados).toEqual([
      { id: 2, generos: ['outros'] },
      { id: 3, generos: ['outros'] },
    ]);
  });

  it('disco que já tem gênero e já foi procurado não é tocado', async () => {
    discosAvisados = [disco(4, 'Chico Buarque', { generos: ['mpb'], genero_discogs: { genres: [], styles: [] } })];
    await preencherFaixasDosDiscos([4]);
    expect(gravados).toEqual([]);
  });
});
