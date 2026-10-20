'use client';

import { useEffect } from 'react';
import AlbumCover from './AlbumCover';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { FiX, FiShoppingBag, FiCheck } from 'react-icons/fi';

export default function ProductDetailSheet({
  item,
  isOpen,
  onClose,
  onAddToCart,
  isInCart = false,
  tipo = 'discos',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const precoFormatado = Number(item.preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const rotuloCaixa = formatCaixa(item.caixa, item.loja);
  const recordLabel = extractRecordLabel(item.observacao);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Overlay 100% Sólido e Opaco (#050506) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#050506',
          zIndex: 1,
        }}
      />

      {/* Folha Inferior Sólida */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'calc(100vh - 32px)',
          backgroundColor: '#18181c',
          borderTop: '1px solid #2d2d35',
          borderLeft: '1px solid #2d2d35',
          borderRight: '1px solid #2d2d35',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.8)',
          padding: '20px 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)',
        }}
      >
        {/* Barra Superior com Botão Fechar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
            Detalhes do Item
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: '#232328',
              border: 'none',
              color: '#e4e4e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Capa Ampliada e Títulos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <AlbumCover
            id={item.id}
            artista={item.artista}
            titulo={item.titulo}
            ano={item.ano}
            capaUrl={item.capa_url}
            size={180}
            tipo={tipo}
          />

          <div>
            {item.artista && (
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#a1a1aa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {item.artista}
              </p>
            )}
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '4px',
              }}
            >
              {item.titulo}
            </h2>
          </div>

          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#121215',
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid #232328',
            }}
          >
            {precoFormatado}
          </div>
        </div>

        {/* Metadados: Loja, Caixa, Selo/Label, Ano, Observações */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '20px',
            backgroundColor: '#121215',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #232328',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#71717a' }}>Localização:</span>
            <strong style={{ color: '#e4e4e7' }}>
              {item.loja || 'Loja Física'} — {rotuloCaixa}
            </strong>
          </div>

          {recordLabel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#71717a' }}>Selo / Gravadora (Label):</span>
              <strong style={{ color: '#d8b4fe' }}>{recordLabel}</strong>
            </div>
          )}

          {item.ano && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#71717a' }}>Ano de Lançamento:</span>
              <strong style={{ color: '#e4e4e7' }}>{item.ano}</strong>
            </div>
          )}

          {item.observacao && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingTop: '8px',
                borderTop: '1px solid #1c1c21',
              }}
            >
              <span style={{ color: '#71717a', fontSize: '13px' }}>
                Observações / Prensagem / Estado:
              </span>
              <p
                style={{
                  fontSize: '14px',
                  color: '#d4d4d8',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {item.observacao}
              </p>
            </div>
          )}
        </div>

        {/* Ação: Botão da Sacola */}
        <div style={{ marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              if (onAddToCart) onAddToCart(item);
            }}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '10px',
              backgroundColor: isInCart ? '#1c1c21' : '#8b1e1e',
              border: isInCart ? '1px solid #3f3f46' : '1px solid #731717',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            {isInCart ? (
              <>
                <FiCheck size={18} color="#4ade80" />
                <span style={{ color: '#4ade80' }}>Item já está na sua sacola</span>
              </>
            ) : (
              <>
                <FiShoppingBag size={18} />
                <span>Adicionar à Sacola</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
