'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import AlbumCover from './AlbumCover';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { FiX, FiShoppingBag, FiCheck, FiChevronRight } from 'react-icons/fi';

const FORMAT_NAMES = {
  discos: 'Vinil (LP)',
  cds: 'CD',
  dvds: 'DVD',
  vhs: 'VHS',
};

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
  const cleanAno = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const showAno = Boolean(cleanAno) && (!recordLabel || !recordLabel.includes(cleanAno));
  const observacaoLimpa = item.observacao
    ? String(item.observacao).replace(/\[[^\]]+\]/g, '').trim()
    : '';

  const lojaSlug = item.loja === 'Loja 1' ? 'loja-1' : item.loja === 'Loja 2' ? 'loja-2' : null;
  const caixaHref =
    lojaSlug && item.caixa
      ? `/lojas/${lojaSlug}/${encodeURIComponent(String(item.caixa).trim())}`
      : null;

  return (
    <div className="productDetailBackdrop">
      {/* Overlay 100% Sólido e Opaco (#050506) */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: '#050506', zIndex: 1 }}
      />

      {/* Folha Inferior / Modal Centralizado Sólido */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${item.titulo}`}
        className="productDetailDialog"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#27272a',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <FiX size={19} />
        </button>

        {/* Capa + Títulos + Preço */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingRight: '44px' }}>
          <AlbumCover
            id={item.id}
            artista={item.artista}
            titulo={item.titulo}
            ano={item.ano}
            capaUrl={item.capa_url}
            size={112}
            tipo={tipo}
          />

          <div style={{ minWidth: 0, paddingTop: '2px' }}>
            {item.artista && (
              <p
                style={{
                  fontSize: '12px',
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
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.25,
                marginTop: '2px',
              }}
            >
              {item.titulo}
            </h2>
            <p
              className="tabularNums"
              style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}
            >
              {precoFormatado}
            </p>
          </div>
        </div>

        {/* Ficha técnica: linhas com divisória, sem caixas aninhadas */}
        <dl className="specList tabularNums" style={{ marginTop: '16px', borderTop: '1px solid #232328' }}>
          <div className="specRow">
            <dt>Formato</dt>
            <dd>{FORMAT_NAMES[tipo] || 'Disco'}</dd>
          </div>
          <div className="specRow">
            <dt>Onde está</dt>
            <dd>
              {item.loja || 'Loja física'} · {rotuloCaixa}
            </dd>
          </div>
          {recordLabel && (
            <div className="specRow">
              <dt>Selo</dt>
              <dd>{recordLabel}</dd>
            </div>
          )}
          {showAno && (
            <div className="specRow">
              <dt>Ano</dt>
              <dd>{cleanAno}</dd>
            </div>
          )}
          {observacaoLimpa && (
            <div className="specRow">
              <dt>Obs.</dt>
              <dd style={{ fontWeight: 500, whiteSpace: 'pre-line' }}>{observacaoLimpa}</dd>
            </div>
          )}
        </dl>

        {caixaHref && (
          <Link
            href={caixaHref}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '1px solid #232328',
              color: '#e4e4e7',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>Ver tudo da {rotuloCaixa}</span>
            <FiChevronRight size={18} color="#a1a1aa" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            if (onAddToCart) onAddToCart(item);
          }}
          style={{
            marginTop: '12px',
            width: '100%',
            minHeight: '48px',
            borderRadius: '10px',
            backgroundColor: isInCart ? '#1f5f3a' : '#8b1e1e',
            border: 'none',
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
          {isInCart ? <FiCheck size={18} /> : <FiShoppingBag size={18} />}
          <span>{isInCart ? 'Na sacola — abrir sacola' : 'Adicionar à sacola'}</span>
        </button>
      </div>
    </div>
  );
}
