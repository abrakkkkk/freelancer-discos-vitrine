import { describe, expect, it } from 'vitest';
import { faixasDoLancamento, soPrimeiraMidia, valorParaGravar } from '@/utils/faixasDiscogs';

const f = (posicao, titulo = posicao) => ({ posicao, titulo, duracao: '' });

describe('soPrimeiraMidia', () => {
  it('LP com CD de brinde listado à parte: fica só o vinil', () => {
    const r = soPrimeiraMidia([f('A1'), f('B1'), f('CD-1'), f('CD-2')]);
    expect(r.map((x) => x.posicao)).toEqual(['A1', 'B1']);
  });

  it('todas com prefixo de mídia: fica a primeira, sem o prefixo', () => {
    const r = soPrimeiraMidia([f('LP-A1'), f('LP-B1'), f('CDr-1')]);
    expect(r.map((x) => x.posicao)).toEqual(['A1', 'B1']);
  });

  it('sem prefixo: não mexe', () => {
    expect(soPrimeiraMidia([f('A1'), f('1-2')]).length).toBe(2);
  });
});

describe('faixasDoLancamento', () => {
  it('abre faixas agrupadas e ignora títulos de seção', () => {
    const r = faixasDoLancamento({
      tracklist: [
        { type_: 'heading', title: 'Lado Um' },
        { type_: 'index', title: 'Suíte', sub_tracks: [{ type_: 'track', position: 'A1a', title: 'Parte 1' }] },
        { type_: 'track', position: 'A2', title: ' Outra ', duration: '3:00' },
      ],
    });
    expect(r).toEqual([
      { posicao: 'A1a', titulo: 'Parte 1', duracao: '' },
      { posicao: 'A2', titulo: 'Outra', duracao: '3:00' },
    ]);
  });
});

describe('valorParaGravar', () => {
  it('marca disco não encontrado com lista vazia', () => {
    expect(valorParaGravar(null, '2026-11-19')).toEqual({ faixas: [], em: '2026-11-19' });
  });
});
