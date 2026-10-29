import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { supabaseServer } from '@/lib/supabaseServer';
import { aplicarFiltroCaixaNaQuery } from '@/services/catalogService';
import { caixaService } from '@/services/caixaService';
import { chaveCaixa } from '@/utils/caixaUtils';
import CaixaItemsClient from '@/components/CaixaItemsClient';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';
import { formatCaixa } from '@/utils/stringUtils';

export const revalidate = 60;

export default async function CaixaDetalhePage({ params }) {
  const { loja: lojaSlug, caixa: caixaParam } = await params;

  let nomeLoja = '';
  if (lojaSlug === 'loja-1') nomeLoja = 'Loja 1';
  else if (lojaSlug === 'loja-2') nomeLoja = 'Loja 2';
  else notFound();

  let caixaDecodificada = '';
  try {
    caixaDecodificada = decodeURIComponent(caixaParam || '').trim();
  } catch {
    notFound();
  }
  if (!caixaDecodificada) notFound();

  let todosItens = [];

  if (supabaseServer) {
    const tabelas = [
      { id: 'discos', temArtista: true },
      { id: 'cds', temArtista: true },
      { id: 'dvds', temArtista: false },
      { id: 'vhs', temArtista: false },
    ];

    const resultados = await Promise.all(
      tabelas.map(async (tab) => {
        let cols = 'id, titulo, preco, loja, caixa, ano, capa_url, observacao';
        if (tab.temArtista) cols += ', artista';

        let query = supabaseServer
          .from(tab.id)
          .select(cols)
          .eq('deletado', false)
          .eq('ativo', true)
          .eq('loja', nomeLoja);

        query = aplicarFiltroCaixaNaQuery(query, caixaDecodificada, nomeLoja);
        const { data, error } = await query.order('titulo');

        // Erro do banco vai para lojas/error.js em vez de aparecer como "caixa vazia".
        if (error) throw new Error(`Erro ao buscar itens de ${tab.id}: ${error.message}`);
        return (data || []).map((d) => ({ ...d, categoria: tab.id }));
      })
    );
    todosItens = resultados.flat();
  }

  // Caixa sem itens só existe se for uma das caixas padrão da loja; senão é 404.
  if (todosItens.length === 0) {
    const chave = chaveCaixa(caixaDecodificada, nomeLoja);
    const existe = caixaService.getDefaultCaixas(nomeLoja).some((c) => c.caixa === chave);
    if (!existe) notFound();
  }

  const rotuloCaixa = formatCaixa(caixaDecodificada, nomeLoja);

  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Link href={`/lojas/${lojaSlug}`} aria-label={`Voltar para ${nomeLoja}`} className="headerBackBtn">
            <FiArrowLeft size={19} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">{rotuloCaixa}</h1>
            <p className="headerSubtitle tabularNums">
              {nomeLoja} · {todosItens.length.toLocaleString('pt-BR')}{' '}
              {todosItens.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <CaixaItemsClient
        itens={todosItens}
        rotuloCaixa={rotuloCaixa}
        nomeLoja={nomeLoja}
      />
    </div>
  );
}
