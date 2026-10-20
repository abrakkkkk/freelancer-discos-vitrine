import { supabaseServer } from '@/lib/supabaseServer';

const TOTAL_PADRAO_CAIXAS_LOJA_1 = 55;
const TOTAL_PADRAO_CAIXAS_LOJA_2 = 20;
const SUPABASE_PAGE_SIZE = 1000;

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

    const mapaCaixas = new Map();

    // Inicializa Caixas obrigatórias (suporta Loja 1, Loja 2 ou Todas as Lojas quando loja === '')
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
    for (const tabela of tabelas) {
      try {
        let offset = 0;
        while (true) {
          let query = supabaseServer
            .from(tabela)
            .select('caixa, loja')
            .eq('deletado', false)
            .eq('ativo', true)
            .not('caixa', 'is', null)
            .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

          if (loja) {
            query = query.eq('loja', loja);
          }

          const { data, error } = await query;

          if (error || !Array.isArray(data) || data.length === 0) {
            break;
          }

          for (const item of data) {
            const raw = String(item.caixa || '').trim();
            if (!raw) continue;

            const itemLoja = item.loja || loja || 'Loja 1';

            // Normaliza para chave do mapa
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

          if (data.length < SUPABASE_PAGE_SIZE) {
            break;
          }
          offset += SUPABASE_PAGE_SIZE;
        }
      } catch (err) {
        console.warn(`Erro ao contar caixas em ${tabela}:`, err);
      }
    }

    return Array.from(mapaCaixas.values()).sort((a, b) => {
      if (a.loja !== b.loja) {
        return a.loja.localeCompare(b.loja);
      }
      const numA = parseInt(a.caixa.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.caixa.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  },

  async getTotaisLojas() {
    if (!supabaseServer) {
      return { 'Loja 1': 0, 'Loja 2': 0 };
    }

    const totais = { 'Loja 1': 0, 'Loja 2': 0 };
    const tabelas = ['discos', 'cds', 'dvds', 'vhs'];

    for (const tabela of tabelas) {
      for (const loja of ['Loja 1', 'Loja 2']) {
        const { count, error } = await supabaseServer
          .from(tabela)
          .select('id', { count: 'exact', head: true })
          .eq('deletado', false)
          .eq('ativo', true)
          .eq('loja', loja);

        if (!error && count) {
          totais[loja] += count;
        }
      }
    }

    return totais;
  },
};
