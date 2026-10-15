import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { supabaseServer } from '@/lib/supabaseServer';
import CaixaItemsClient from '@/components/CaixaItemsClient';
import { formatCaixa } from '@/utils/stringUtils';

export const revalidate = 60;

export default async function CaixaDetalhePage({ params }) {
  const { loja: lojaSlug, caixa: caixaParam } = await params;

  let nomeLoja = '';
  if (lojaSlug === 'loja-1') nomeLoja = 'Loja 1';
  else if (lojaSlug === 'loja-2') nomeLoja = 'Loja 2';
  else notFound();

  const caixaDecodificada = decodeURIComponent(caixaParam || '');
  if (!caixaDecodificada) notFound();

  let todosItens = [];

  if (supabaseServer) {
    const tabelas = [
      { id: 'discos', temArtista: true },
      { id: 'cds', temArtista: true },
      { id: 'dvds', temArtista: false },
      { id: 'vhs', temArtista: false },
    ];

    for (const tab of tabelas) {
      try {
        let cols = 'id, titulo, preco, loja, caixa, ano, capa_url, observacao';
        if (tab.temArtista) cols += ', artista';

        const { data, error } = await supabaseServer
          .from(tab.id)
          .select(cols)
          .eq('deletado', false)
          .eq('ativo', true)
          .eq('loja', nomeLoja)
          .eq('caixa', caixaDecodificada)
          .order('titulo');

        if (!error && Array.isArray(data)) {
          const comCategoria = data.map((d) => ({ ...d, categoria: tab.id }));
          todosItens = todosItens.concat(comCategoria);
        }
      } catch (err) {
        console.error(`Erro ao buscar itens de ${tab.id}:`, err);
      }
    }
  }

  const rotuloCaixa = formatCaixa(caixaDecodificada, nomeLoja);

  return (
    <div className="pageContainer">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #232328',
        }}
      >
        <Link
          href={`/lojas/${lojaSlug}`}
          aria-label="Voltar para grade de caixas"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#151518',
            border: '1px solid #232328',
            color: '#e4e4e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            {nomeLoja} — {rotuloCaixa}
          </h1>
          <p style={{ fontSize: '12.5px', color: '#a1a1aa' }}>
            {todosItens.length} {todosItens.length === 1 ? 'item disponível' : 'itens disponíveis'}
          </p>
        </div>
      </header>

      <CaixaItemsClient
        itens={todosItens}
        rotuloCaixa={rotuloCaixa}
        nomeLoja={nomeLoja}
      />
    </div>
  );
}
