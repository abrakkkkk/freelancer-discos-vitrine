import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { aplicarFiltroCaixaNaQuery } from '@/services/catalogService';
import { caixaService } from '@/services/caixaService';
import { chaveCaixa } from '@/utils/caixaUtils';
import CaixaEditorialClient from '@/editorial/CaixaEditorialClient';
import { NavDesktopEditorial } from '@/editorial/NavEditorial';
import VoltarDaCaixa from '@/components/VoltarDaCaixa';
import { formatCaixa } from '@/utils/stringUtils';
import { nomeLojaPorSlug, hrefDaCaixa } from '@/utils/lojas';
import { compartilhamento } from '@/utils/seo';

export const revalidate = 60;

function decodificarCaixa(caixaParam) {
  try {
    return decodeURIComponent(caixaParam || '').trim();
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }) {
  const { loja: lojaSlug, caixa: caixaParam } = await params;
  const nomeLoja = nomeLojaPorSlug(lojaSlug);
  const caixa = decodificarCaixa(caixaParam);
  if (!nomeLoja || !caixa) return {};
  const nome = `${formatCaixa(caixa, nomeLoja)} · ${nomeLoja}`;
  return {
    title: nome,
    alternates: { canonical: `/lojas/${lojaSlug}/${caixaParam}` },
    ...compartilhamento({
      titulo: `${nome} · Freelancer Discos`,
      descricao: `Tudo o que está na ${formatCaixa(caixa, nomeLoja)} da ${nomeLoja}, Freelancer Discos.`,
      caminho: `/lojas/${lojaSlug}/${caixaParam}`,
    }),
  };
}

export default async function CaixaDetalhePage({ params }) {
  const { loja: lojaSlug, caixa: caixaParam } = await params;

  const nomeLoja = nomeLojaPorSlug(lojaSlug);
  if (!nomeLoja) notFound();

  const caixaDecodificada = decodificarCaixa(caixaParam);
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
    // Discos, CDs, DVDs e fitas juntos por título, a ordem do caixote.
    const comparador = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
    todosItens = resultados.flat().sort((a, b) => comparador.compare(a.titulo || '', b.titulo || ''));
  }

  // Caixas vizinhas da mesma loja, para ir de uma caixa à outra sem voltar ao índice.
  const chaveAtual = chaveCaixa(caixaDecodificada, nomeLoja);
  const caixasDaLoja = (await caixaService.getCaixasComContagem(nomeLoja)).filter((c) => c.loja === nomeLoja);
  const indiceAtual = caixasDaLoja.findIndex((c) => c.caixa === chaveAtual);
  const vizinha = (c) => c && { rotulo: formatCaixa(c.caixa, nomeLoja), href: hrefDaCaixa(nomeLoja, c.caixa) };
  const anterior = indiceAtual > 0 ? vizinha(caixasDaLoja[indiceAtual - 1]) : null;
  const proxima = indiceAtual >= 0 ? vizinha(caixasDaLoja[indiceAtual + 1]) : null;

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
          <VoltarDaCaixa lojaHref={`/lojas/${lojaSlug}`} nomeLoja={nomeLoja} />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">{rotuloCaixa}</h1>
            <p className="headerSubtitle tabularNums">
              {nomeLoja} · {todosItens.length.toLocaleString('pt-BR')}{' '}
              {todosItens.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        <NavDesktopEditorial />
      </header>

      <CaixaEditorialClient
        itens={todosItens}
        rotuloCaixa={rotuloCaixa}
        nomeLoja={nomeLoja}
        anterior={anterior}
        proxima={proxima}
      />
    </div>
  );
}
