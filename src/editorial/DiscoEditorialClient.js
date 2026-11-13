'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheck, FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import AlbumCover from '@/components/AlbumCover';
import Localizacao from '@/components/Localizacao';
import { useCart } from '@/components/CartProvider';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import ListaEditorial from './ListaEditorial';

const FORMATO = { discos: 'Vinil (LP)', cds: 'CD', dvds: 'DVD', vhs: 'VHS' };

function precoBRL(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Página própria de um disco, com endereço para compartilhar. No celular a lista
 * abre o detalhe, então aqui só chega quem veio por link compartilhado.
 */
export default function DiscoEditorialClient({ item, vizinhos = [] }) {
  const router = useRouter();
  const { estaNaSacola, adicionar } = useCart();
  const naSacola = estaNaSacola(item);

  const rotuloCaixa = formatCaixa(item.caixa, item.loja);
  const temCaixa = rotuloCaixa !== '—';
  const caixaHref = temCaixa ? hrefDaCaixa(item.loja, item.caixa) : null;
  const selo = extractRecordLabel(item.observacao);
  const ano = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const mostrarAno = Boolean(ano) && (!selo || !selo.includes(ano));
  const observacao = item.observacao ? String(item.observacao).replace(/\[[^\]]+\]/g, '').trim() : '';

  // Volta para onde o cliente estava; se abriu o link direto, vai para o catálogo.
  const voltar = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <article className="edDisco">
      <nav className="edDiscoTrilha" aria-label="Você está em">
        <button type="button" onClick={voltar} className="edDiscoVoltar">
          <FiArrowLeft size={16} aria-hidden="true" />
          Voltar
        </button>
        <span className="edDiscoCaminho">
          <Link href="/">Catálogo</Link>
          {caixaHref && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={caixaHref}>
                {rotuloCaixa} · {item.loja}
              </Link>
            </>
          )}
        </span>
      </nav>

      <div className="edDiscoCorpo">
        <div className="edDiscoCapa">
          <AlbumCover
            id={item.id}
            artista={item.artista}
            titulo={item.titulo}
            ano={item.ano}
            capaUrl={item.capa_url}
            fluid
            tipo={item.categoria}
          />
        </div>

        <div className="edDiscoFicha">
          {item.artista && <p className="edDiscoArtista">{item.artista}</p>}
          <h1 className="edDiscoTitulo">{item.titulo}</h1>
          <p className="edDiscoPreco tabularNums">{precoBRL(item.preco)}</p>

          {caixaHref ? (
            <Link href={caixaHref} className="sheetLocal tabularNums" aria-label={`${rotuloCaixa}, ${item.loja}. Ver tudo desta caixa`}>
              <span style={{ display: 'flex', minWidth: 0, flex: 1 }}>
                <Localizacao caixa={item.caixa} loja={item.loja} tamanho="detalhe" />
              </span>
              <FiChevronRight size={20} color="var(--text-muted)" aria-hidden="true" />
            </Link>
          ) : (
            <p className="sheetLocal tabularNums">
              <Localizacao caixa={item.caixa} loja={item.loja} tamanho="detalhe" />
            </p>
          )}

          <dl className="specList tabularNums">
            <div className="specRow">
              <dt>Formato</dt>
              <dd>{FORMATO[item.categoria] || 'Disco'}</dd>
            </div>
            {selo && (
              <div className="specRow">
                <dt>Selo</dt>
                <dd>{selo}</dd>
              </div>
            )}
            {mostrarAno && (
              <div className="specRow">
                <dt>Ano</dt>
                <dd>{ano}</dd>
              </div>
            )}
            {observacao && (
              <div className="specRow">
                <dt>Obs.</dt>
                <dd style={{ fontWeight: 500, whiteSpace: 'pre-line' }}>{observacao}</dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={() => adicionar(item)}
            className={`edDiscoSacola ${naSacola ? 'edDiscoSacolaNa' : ''}`}
          >
            {naSacola ? <FiCheck size={18} aria-hidden="true" /> : <FiShoppingBag size={18} aria-hidden="true" />}
            {naSacola ? 'Na sacola · abrir sacola' : 'Adicionar à sacola'}
          </button>
        </div>
      </div>

      {vizinhos.length > 0 && (
        <section className="edDiscoVizinhos" aria-label="Mais desta caixa">
          <div className="edCaixaCab">
            <h2 className="edCaixaNum">Mais desta caixa</h2>
            {caixaHref && (
              <Link href={caixaHref} className="edCaixaLink">
                Ver caixa
                <FiChevronRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
          <ListaEditorial
            itens={vizinhos}
            categoria={item.categoria}
            agruparPorCaixa={false}
            mostrarCaixa={false}
            estaNaSacola={estaNaSacola}
            onAdicionar={adicionar}
            onAbrir={(v) => router.push(`/disco/${v.categoria}/${v.id}`)}
          />
        </section>
      )}
    </article>
  );
}
