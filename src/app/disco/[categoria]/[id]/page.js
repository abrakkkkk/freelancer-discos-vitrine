import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { aplicarFiltroCaixaNaQuery, isValidCategory } from '@/services/catalogService';
import { formatCaixa } from '@/utils/stringUtils';
import DiscoEditorialClient from '@/editorial/DiscoEditorialClient';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { compartilhamento } from '@/utils/seo';
import { dadosDoDisco, JsonLd } from '@/utils/dadosEstruturados';

export const revalidate = 60;

const VIZINHOS = 12;

async function buscarDisco(categoria, idParam) {
  if (!supabaseServer || !isValidCategory(categoria)) return null;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;

  const temArtista = categoria === 'discos' || categoria === 'cds';
  const colunas = `id, titulo, preco, loja, caixa, ano, capa_url, observacao${temArtista ? ', artista' : ''}`;
  const { data, error } = await supabaseServer
    .from(categoria)
    .select(colunas)
    .eq('id', id)
    .eq('deletado', false)
    .eq('ativo', true)
    .maybeSingle();

  // Erro do banco vai para a página de erro; disco inexistente ou vendido vira 404.
  if (error) throw new Error(`Erro ao buscar o disco: ${error.message}`);
  if (!data) return null;

  // Outros itens da mesma caixa, para quem vai à loja buscar.
  let vizinhos = [];
  if (data.caixa) {
    let consulta = supabaseServer
      .from(categoria)
      .select(colunas)
      .eq('deletado', false)
      .eq('ativo', true)
      .neq('id', id);
    if (data.loja) consulta = consulta.eq('loja', data.loja);
    consulta = aplicarFiltroCaixaNaQuery(consulta, data.caixa, data.loja || '');
    const res = await consulta.order('titulo').limit(VIZINHOS);
    vizinhos = res.error ? [] : res.data || [];
  }

  return { item: { ...data, categoria }, vizinhos: vizinhos.map((v) => ({ ...v, categoria })) };
}

export async function generateMetadata({ params }) {
  const { categoria, id } = await params;
  const resultado = await buscarDisco(categoria, id);
  if (!resultado) return {};
  const { item } = resultado;
  const nome = item.artista ? `${item.artista} · ${item.titulo}` : item.titulo;
  const preco = Number(item.preco) > 0
    ? Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ')
    : null;
  const descricao = [preco, `${formatCaixa(item.caixa, item.loja)}, ${item.loja || 'Freelancer Discos'}`]
    .filter(Boolean)
    .join(' · ');
  return {
    title: nome,
    alternates: { canonical: `/disco/${categoria}/${id}` },
    // No WhatsApp o disco aparece com a própria capa, o preço e onde está.
    ...compartilhamento({
      titulo: nome,
      descricao: `${descricao}. Freelancer Discos.`,
      caminho: `/disco/${categoria}/${id}`,
      imagem: item.capa_url ? { url: item.capa_url, alt: `Capa de ${nome}` } : null,
    }),
    // No Google o nome do disco abre a descrição; no WhatsApp ele já vem no título.
    description: `${nome}. ${descricao}. Freelancer Discos.`,
  };
}

export default async function DiscoPage({ params }) {
  const { categoria, id } = await params;
  const resultado = await buscarDisco(categoria, id);
  if (!resultado) notFound();

  return (
    <div className="pageContainer">
      <JsonLd dados={dadosDoDisco(resultado.item, categoria)} />
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <p className="headerTitle">Freelancer Discos</p>
            <p className="headerSubtitle">Vitrine do estoque</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      <DiscoEditorialClient item={resultado.item} vizinhos={resultado.vizinhos} />

      <BarraEditorial />
    </div>
  );
}
