'use client';

import AlbumCover from './AlbumCover';
import { formatCaixa } from '@/utils/stringUtils';
import { FiCheck, FiShoppingBag } from 'react-icons/fi';

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

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(item)}
      style={{
        backgroundColor: '#151518',
        border: '1px solid #232328',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <AlbumCover
          id={item.id}
          artista={item.artista}
          titulo={item.titulo}
          ano={item.ano}
          capaUrl={item.capa_url}
          size={160}
          tipo={tipo}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {item.artista && (
          <span
            style={{
              fontSize: '12px',
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
            fontSize: '15px',
            fontWeight: 600,
            color: '#e4e4e7',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '38px',
          }}
        >
          {item.titulo}
        </h3>

        {localizacao && (
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#1c1c21',
              border: '1px solid #2d2d35',
              fontSize: '11px',
              fontWeight: 500,
              color: '#d4d4d8',
              marginTop: '2px',
            }}
          >
            {localizacao}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid #232328',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10.5px', color: '#71717a', textTransform: 'uppercase' }}>
            Preço
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {precoFormatado}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddToCart) onAddToCart(item);
          }}
          aria-label={isInCart ? 'Item na sacola' : 'Adicionar à sacola'}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isInCart ? '#1c1c21' : '#8b1e1e',
            border: isInCart ? '1px solid #3f3f46' : '1px solid #731717',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'background-color 0.15s ease',
          }}
        >
          {isInCart ? (
            <>
              <FiCheck size={16} color="#4ade80" />
              <span style={{ color: '#4ade80' }}>Na sacola</span>
            </>
          ) : (
            <>
              <FiShoppingBag size={16} />
              <span>Adicionar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
