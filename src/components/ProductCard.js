'use client';

import Link from 'next/link';
import AlbumCover from './AlbumCover';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { FiArchive, FiCheck, FiPlus } from 'react-icons/fi';

function CardLocal({ href, caixa, loja, corLoja }) {
  const conteudo = (
    <>
      <FiArchive size={15} aria-hidden="true" style={{ flexShrink: 0, color: '#d4d4d8' }} />
      {caixa && <span className="cardLocalCaixa">{caixa}</span>}
      {loja && (
        <span className="cardLocalLoja">
          <span className="cardLocalPonto" style={{ backgroundColor: corLoja }} aria-hidden="true" />
          {loja}
        </span>
      )}
    </>
  );

  if (!href) return <p className="cardLocal tabularNums">{conteudo}</p>;
  return (
    <Link
      href={href}
      className="cardLocal cardLocalLink tabularNums"
      aria-label={`Ver tudo da ${caixa || 'caixa'}${loja ? `, ${loja}` : ''}`}
    >
      {conteudo}
    </Link>
  );
}

export default function ProductCard({
  item,
  tipo = 'discos',
  onOpenDetail,
  onAddToCart,
  isInCart = false,
  // Na página de uma caixa, todos os itens estão nela: a linha de localização seria repetida.
  mostrarLocal = true,
}) {
  const precoFormatado = Number(item.preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const rotuloCaixa = formatCaixa(item.caixa, item.loja);
  const temCaixa = rotuloCaixa !== '—';
  const caixaHref = hrefDaCaixa(item.loja, item.caixa, { doCatalogo: true });
  const corLoja =
    item.loja === 'Loja 2'
      ? 'var(--loja-2)'
      : item.loja === 'Loja 1'
        ? 'var(--loja-1)'
        : /anexo/i.test(`${item.loja || ''} ${item.caixa || ''}`)
          ? 'var(--loja-anexo)'
          : 'var(--badge-neutral)';

  const recordLabel = extractRecordLabel(item.observacao);
  const cleanAno = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const showAnoBadge = Boolean(cleanAno) && (!recordLabel || !recordLabel.includes(cleanAno));
  const isImportado = Boolean(item.observacao && /importado/i.test(item.observacao));

  // O card não é um botão: o título é o botão que abre o detalhe e, via ::after,
  // cobre o card inteiro. Assim o botão "Sacola" fica ao lado, não dentro de outro botão.
  return (
    <article className="productCard">
      <AlbumCover
        id={item.id}
        artista={item.artista}
        titulo={item.titulo}
        ano={item.ano}
        capaUrl={item.capa_url}
        fluid
        tipo={tipo}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
        {item.artista && (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#a1a1aa',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.artista}
          </span>
        )}

        <h2
          style={{
            fontSize: '14.5px',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            className="productCardOpen"
            onClick={() => onOpenDetail && onOpenDetail(item)}
            aria-label={`Ver detalhes de ${item.artista ? `${item.artista} - ` : ''}${item.titulo}`}
          >
            {item.titulo}
          </button>
        </h2>

        {/* Onde o disco está: é o que a vitrine tem de diferente, então vem antes das etiquetas. */}
        {mostrarLocal && (temCaixa || item.loja) && (
          <CardLocal
            href={caixaHref}
            caixa={temCaixa ? rotuloCaixa : null}
            loja={item.loja}
            corLoja={corLoja}
          />
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
          {recordLabel && (
            <span className="badge badgeLabel tabularNums" title={`Selo: ${recordLabel}`}>
              {recordLabel}
            </span>
          )}
          {showAnoBadge && <span className="badge tabularNums">{cleanAno}</span>}
          {isImportado && <span className="badge badgeSuccess">Importado</span>}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid #232328',
          gap: '6px',
        }}
      >
        <span
          className="tabularNums"
          style={{
            fontSize: '15.5px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {precoFormatado}
        </span>

        <button
          type="button"
          onClick={() => onAddToCart && onAddToCart(item)}
          aria-label={isInCart ? 'Item já na sacola — abrir sacola' : 'Adicionar à sacola'}
          className={`productCardActionBtn ${isInCart ? 'productCardActionBtnInCart' : ''}`}
        >
          {isInCart ? <FiCheck size={14} strokeWidth={2.5} /> : <FiPlus size={14} strokeWidth={2.5} />}
          <span>{isInCart ? 'Na sacola' : 'Sacola'}</span>
        </button>
      </div>
    </article>
  );
}
