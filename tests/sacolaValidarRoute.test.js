import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase simulado: cada tabela responde com `respostas[tabela]`.
const respostas = {};
const supabaseFalso = {
  from: (tabela) => {
    const q = {
      select: () => q,
      in: () => q,
      eq: () => q,
      then: (resolve) => resolve(respostas[tabela] ?? { data: [], error: null }),
    };
    return q;
  },
};

vi.mock('@/lib/supabaseServer', () => ({
  get supabaseServer() {
    return supabaseFalso;
  },
}));

const { POST } = await import('../src/app/api/sacola/validar/route.js');

const req = (body) =>
  new Request('http://localhost/api/sacola/validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/sacola/validar', () => {
  beforeEach(() => {
    for (const k of Object.keys(respostas)) delete respostas[k];
  });

  it('separa disponíveis e indisponíveis', async () => {
    respostas.discos = { data: [{ id: 1 }], error: null };
    const res = await POST(req({ itens: [{ id: 1, categoria: 'discos' }, { id: 2, categoria: 'discos' }] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.disponiveisKeys).toEqual(['discos:1']);
    expect(json.indisponiveisKeys).toEqual(['discos:2']);
  });

  it('erro do banco responde 503 em vez de marcar tudo como indisponível', async () => {
    respostas.discos = { data: null, error: { message: 'timeout' } };
    const res = await POST(req({ itens: [{ id: 1, categoria: 'discos' }] }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.indisponiveisKeys).toBeUndefined();
  });

  it('JSON inválido responde 400', async () => {
    const res = await POST(req('{nao é json'));
    expect(res.status).toBe(400);
  });

  it('recusa listas grandes demais', async () => {
    const itens = Array.from({ length: 101 }, (_, i) => ({ id: i + 1 }));
    const res = await POST(req({ itens }));
    expect(res.status).toBe(400);
  });

  it('id inválido fica indisponível sem derrubar a consulta', async () => {
    respostas.discos = { data: [{ id: 3 }], error: null };
    const res = await POST(req({ itens: [{ id: 'abc', categoria: 'discos' }, { id: 3, categoria: 'discos' }] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.disponiveisKeys).toEqual(['discos:3']);
    expect(json.indisponiveisKeys).toEqual(['discos:abc']);
  });
});
