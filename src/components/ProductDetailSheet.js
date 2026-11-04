'use client';

import { useRef } from 'react';
import Link from 'next/link';
import AlbumCover from './AlbumCover';
import { useModalDialog } from '@/hooks/useModalDialog';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { FiArchive, FiX, FiShoppingBag, FiCheck, FiChevronRight } from 'react-icons/fi';

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
  const dialogRef = useRef(null);
  const fecharENavegar = useModalDialog(isOpen && Boolean(item), onClose, dialogRef);

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

  const caixaHref = hrefDaCaixa(item.loja, item.caixa);
  const temCaixa = rotuloCaixa !== '—';
  const localConteudo = (
    <>
      <FiArchive size={22} aria-hidden="true" style={{ flexShrink: 0, color: '#d4d4d8' }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
        <span className="sheetLocalCaixa">{temCaixa ? rotuloCaixa : 'Caixa não informada'}</span>
        <span className="sheetLocalLoja">
          {item.loja || 'Loja física'}
          {caixaHref ? ' · ver tudo desta caixa' : ''}
        </span>
      </span>
      {caixaHref && <FiChevronRight size={20} color="#a1a1aa" aria-hidden="true" />}
    </>
  );

  return (
    <div className="productDetailBackdrop">
      {/* Overlay 100% Sólido e Opaco (#050506) */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: '#050506', zIndex: 1 }}
      />

      {/* Folha Inferior / Modal Centralizado Sólido */}
      <div
        ref={dialogRef}
        tabIndex={-1}
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
            top: '10px',
            right: '10px',
            // Fica sobre a capa, que agora ocupa o topo da folha.
            zIndex: 2,
            width: '44px',
            height: '44px',
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

        {/* Capa grande primeiro: é o momento em que o cliente se interessou pelo disco. */}
        <div className="sheetCapa">
          <AlbumCover
            id={item.id}
            artista={item.artista}
            titulo={item.titulo}
            ano={item.ano}
            capaUrl={item.capa_url}
            fluid
            tipo={tipo}
          />
        </div>

        {/* Títulos + Preço */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ minWidth: 0 }}>
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
                fontSize: '21px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: '2px',
                overflowWrap: 'anywhere',
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

        {/* Onde está: logo abaixo do preço e maior que a ficha, porque é o que o cliente procura. */}
        {caixaHref ? (
          <Link
            href={caixaHref}
            className="sheetLocal tabularNums"
            aria-label={`${temCaixa ? rotuloCaixa : 'Caixa'}, ${item.loja}. Ver tudo desta caixa`}
            onClick={(e) => {
              // Ctrl/Cmd+clique (nova aba) segue o comportamento normal do link.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              fecharENavegar(caixaHref);
            }}
          >
            {localConteudo}
          </Link>
        ) : (
          <p className="sheetLocal tabularNums">{localConteudo}</p>
        )}

        {/* Ficha técnica: linhas com divisória, sem caixas aninhadas */}
        <dl className="specList tabularNums">
          <div className="specRow">
            <dt>Formato</dt>
            <dd>{FORMAT_NAMES[tipo] || 'Disco'}</dd>
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

        {/* O botão fica preso no fim da folha: com a capa grande, a ficha pode precisar rolar. */}
        <div className="sheetAcao">
        <button
          type="button"
          onClick={() => {
            if (onAddToCart) onAddToCart(item);
          }}
          style={{
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
    </div>
  );
}
