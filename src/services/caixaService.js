import { supabaseServer } from '@/lib/supabaseServer';

const TOTAL_PADRAO_CAIXAS_LOJA_1 = 55;
const TOTAL_PADRAO_CAIXAS_LOJA_2 = 20;
const SUPABASE_PAGE_SIZE = 1000;
const CACHE_TTL_MS = 60 * 1000;

const caixasCache = new Map();
let totaisLojasCache = { data: null, expiresAt: 0 };

async function fetchAllRowsFromTable(tabela, loja) {
  let firstQuery = supabaseServer
    .from(tabela)
    .select('caixa, loja', { count: 'exact' })
    .eq('deletado', false)
    .eq('ativo', true)
    .not('caixa', 'is', null)
    .range(0, SUPABASE_PAGE_SIZE - 1);

  if (loja) {
    firstQuery = firstQuery.eq('loja', loja);
  }

  const { data: firstBatch, count, error } = await firstQuery;
  if (error || !Array.isArray(firstBatch) || firstBatch.length === 0) {
    return [];
  }

  const totalRows = count || firstBatch.length;
  if (totalRows <= SUPABASE_PAGE_SIZE) {
    return firstBatch;
  }

  const remainingPromises = [];
  for (let offset = SUPABASE_PAGE_SIZE; offset < totalRows; offset += SUPABASE_PAGE_SIZE) {
    let pageQuery = supabaseServer
      .from(tabela)
      .select('caixa, loja')
      .eq('deletado', false)
      .eq('ativo', true)
      .not('caixa', 'is', null)
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    if (loja) {
      pageQuery = pageQuery.eq('loja', loja);
    }
    remainingPromises.push(pageQuery);
  }

  const remainingResults = await Promise.all(remainingPromises);
  let allRows = firstBatch;
  for (const res of remainingResults) {
    if (!res.error && Array.isArray(res.data)) {
      allRows = allRows.concat(res.data);
    }
  }
  return allRows;
}

export const caixaService = {
  getDefaultCaixas(loja = '') {
    const lista = [];

    if (!loja || loja === 'Loja 1') {
      for (let i = 1; i <= TOTAL_PADRAO_CAIXAS_LOJA_1; i++) {
        lista.push({
          caixa: String(i),
          loja: 'Loja 1',
          label: `Caixa ${i}`,
          total: 0,
        });
      }
    }

    if (!loja || loja === 'Loja 2') {
      for (let i = 1; i <= TOTAL_PADRAO_CAIXAS_LOJA_2; i++) {
        lista.push({
          caixa: `Caixa ${i}B`,
          loja: 'Loja 2',
          label: `Caixa ${i}B`,
          total: 0,
        });
      }
    }

    return lista;
  },

  async getCaixasComContagem(loja = 'Loja 1') {
    if (!supabaseServer) {
      return this.getDefaultCaixas(loja);
    }

    const cacheKey = loja || '__ALL__';
    const now = Date.now();
    const cached = caixasCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const mapaCaixas = new Map();

    if (!loja || loja === 'Loja 1') {
      for (let i = 1; i <= TOTAL_PADRAO_CAIXAS_LOJA_1; i++) {
        const idCaixa = String(i);
        mapaCaixas.set(idCaixa, {
          caixa: idCaixa,
          loja: 'Loja 1',
          label: `Caixa ${i}`,
          total: 0,
        });
      }
    }

    if (!loja || loja === 'Loja 2') {
      for (let i = 1; i <= TOTAL_PADRAO_CAIXAS_LOJA_2; i++) {
        const idCaixa = `Caixa ${i}B`;
        mapaCaixas.set(idCaixa, {
          caixa: idCaixa,
          loja: 'Loja 2',
          label: idCaixa,
          total: 0,
        });
      }
    }

    const tabelas = ['discos', 'cds', 'dvds', 'vhs'];
    try {
      const resultadosTabelas = await Promise.all(
        tabelas.map((tabela) => fetchAllRowsFromTable(tabela, loja))
      );

      for (const data of resultadosTabelas) {
        for (const item of data) {
          const raw = String(item.caixa || '').trim();
          if (!raw) continue;

          const itemLoja = item.loja || loja || 'Loja 1';

          let chave = raw;
          const matchB = raw.match(/^(?:caixa|c)?\s*(\d+)\s*b$/i);
          const matchNum = raw.match(/^(?:caixa|c)?\s*(\d+)$/i);

          if (itemLoja === 'Loja 2') {
            if (matchB) chave = `Caixa ${matchB[1]}B`;
            else if (matchNum) chave = `Caixa ${matchNum[1]}B`;
          } else if (itemLoja === 'Loja 1' && matchNum) {
            chave = matchNum[1];
          }

          if (mapaCaixas.has(chave)) {
            mapaCaixas.get(chave).total += 1;
          } else {
            const label =
              itemLoja === 'Loja 1' && !isNaN(Number(raw))
                ? `Caixa ${raw}`
                : matchB
                  ? `Caixa ${matchB[1]}B`
                  : raw;
            mapaCaixas.set(chave, {
              caixa: chave,
              loja: itemLoja,
              label,
              total: 1,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao contar caixas:', err);
    }

    const resultado = Array.from(mapaCaixas.values()).sort((a, b) => {
      if (a.loja !== b.loja) {
        return a.loja.localeCompare(b.loja);
      }
      const numA = parseInt(a.caixa.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.caixa.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    caixasCache.set(cacheKey, { data: resultado, expiresAt: Date.now() + CACHE_TTL_MS });
    return resultado;
  },

  async getTotaisLojas() {
    if (!supabaseServer) {
      return { 'Loja 1': 0, 'Loja 2': 0 };
    }

    const now = Date.now();
    if (totaisLojasCache.data && totaisLojasCache.expiresAt > now) {
      return totaisLojasCache.data;
    }

    const totais = { 'Loja 1': 0, 'Loja 2': 0 };
    const tabelas = ['discos', 'cds', 'dvds', 'vhs'];
    const lojas = ['Loja 1', 'Loja 2'];

    const queries = [];
    for (const tabela of tabelas) {
      for (const loja of lojas) {
        queries.push(
          supabaseServer
            .from(tabela)
            .select('id', { count: 'exact', head: true })
            .eq('deletado', false)
            .eq('ativo', true)
            .eq('loja', loja)
            .then(({ count, error }) => ({ loja, count: !error && count ? count : 0 }))
        );
      }
    }

    const results = await Promise.all(queries);
    for (const r of results) {
      totais[r.loja] += r.count;
    }

    totaisLojasCache = { data: totais, expiresAt: Date.now() + CACHE_TTL_MS };
    return totais;
  },
};
