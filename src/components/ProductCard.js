'use client';

import AlbumCover from './AlbumCover';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { FiCheck, FiPlus } from 'react-icons/fi';

export default function ProductCard({
  item,
  tipo = 'discos',
  onOpenDetail,
  onAddToCart,
  isInCart = false,
}) {
  const precoFormatado = Number(item.preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const rotuloCaixa = formatCaixa(item.caixa, item.loja);
  const localizacao = [item.loja, rotuloCaixa !== '—' ? rotuloCaixa : null]
    .filter(Boolean)
    .join(' · ');

  const recordLabel = extractRecordLabel(item.observacao);
  const cleanAno = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const showAnoBadge = Boolean(cleanAno) && (!recordLabel || !recordLabel.includes(cleanAno));
  const isImportado = Boolean(item.observacao && /importado/i.test(item.observacao));

  const handleCardKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onOpenDetail) onOpenDetail(item);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${item.artista ? `${item.artista} - ` : ''}${item.titulo}`}
      onClick={() => onOpenDetail && onOpenDetail(item)}
      onKeyDown={handleCardKeyDown}
      className="productCard"
    >
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

        <h3
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
          {item.titulo}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
          {localizacao && <span className="badge tabularNums">{localizacao}</span>}
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
          onClick={(e) => {
            e.stopPropagation();
            if (onAddToCart) onAddToCart(item);
          }}
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
