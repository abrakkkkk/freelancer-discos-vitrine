'use client';

import { useState } from 'react';
import AlbumCover from './AlbumCover';
import { formatCaixa } from '@/utils/stringUtils';
import { generateWhatsAppUrl, getCartItemKey } from '@/utils/cartUtils';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const FORMAT_SHORT = {
  discos: 'LP',
  cds: 'CD',
  dvds: 'DVD',
  vhs: 'VHS',
};

export default function CartDrawer({
  isOpen,
  onClose,
  itens = [],
  onRemoveItem,
  onClearCart,
  onReplaceCart,
}) {
  const [nome, setNome] = useState('');
  const [bairro, setBairro] = useState('');
  const [validando, setValidando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const total = itens.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);
  const totalFmt = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleFinalizarWhatsApp = async () => {
    if (itens.length === 0 || validando) return;
    setValidando(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/sacola/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map((i) => ({ id: i.id, categoria: i.categoria || 'discos' })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const indisponiveisKeys = new Set(data.indisponiveisKeys || []);
        const indisponiveisIds = new Set(data.indisponiveis || []);

        const qtdIndisponiveis =
          indisponiveisKeys.size > 0 ? indisponiveisKeys.size : indisponiveisIds.size;

        if (qtdIndisponiveis > 0) {
          const restantes = itens.filter((i) => {
            const key = getCartItemKey(i);
            if (indisponiveisKeys.size > 0) {
              return !indisponiveisKeys.has(key);
            }
            return !indisponiveisIds.has(i.id);
          });
          if (onReplaceCart) onReplaceCart(restantes);

          setFeedback({
            tipo: 'aviso',
            texto: `${qtdIndisponiveis} ${qtdIndisponiveis === 1 ? 'item indisponível foi removido' : 'itens indisponíveis foram removidos'} da sua sacola.`,
          });
          setValidando(false);

          setTimeout(() => {
            setFeedback(null);
          }, 5000);
          return;
        }
      }

      const urlWa = generateWhatsAppUrl(itens, nome, bairro);
      window.open(urlWa, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (err) {
      console.error('Erro ao validar sacola:', err);
      const urlWa = generateWhatsAppUrl(itens, nome, bairro);
      window.open(urlWa, '_blank', 'noopener,noreferrer');
      onClose();
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="cartDrawerBackdrop">
      {/* Overlay Sólido e Opaco (#050506) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#050506',
          zIndex: 1,
        }}
      />

      {/* Painel da Sacola */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sua Sacola"
        className="cartDrawerPanel"
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            borderBottom: '1px solid #232328',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Sua Sacola
            </h2>
            <span
              className="tabularNums"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#8b1e1e',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {itens.length > 1 && onClearCart && (
              <button
                type="button"
                onClick={onClearCart}
                className="textBtn"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar sacola"
              style={{
                width: '38px',
                height: '38px',
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
          </div>
        </div>

        {/* Feedback / Aviso */}
        {feedback && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              backgroundColor: '#7c4a12',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {feedback.texto}
          </div>
        )}

        {/* Lista de Itens */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '340px',
            padding: '4px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {itens.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#71717a',
                fontSize: '14px',
              }}
            >
              Sua sacola está vazia. Explore o catálogo e adicione os títulos desejados.
            </div>
          ) : (
            itens.map((item) => {
              const precoFmt = Number(item.preco || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              });
              const rotuloCaixa = formatCaixa(item.caixa, item.loja);
              const itemKey = getCartItemKey(item);
              const fmtTag = FORMAT_SHORT[item.categoria] || 'LP';

              return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 0',
                    borderBottom: '1px solid #232328',
                  }}
                >
                  <AlbumCover
                    id={item.id}
                    artista={item.artista}
                    titulo={item.titulo}
                    ano={item.ano}
                    capaUrl={item.capa_url}
                    size={50}
                    tipo={item.categoria || 'discos'}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.artista && (
                      <p
                        style={{
                          fontSize: '10.5px',
                          color: '#a1a1aa',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.artista}
                      </p>
                    )}
                    <h4
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.titulo}
                    </h4>
                    <span className="tabularNums" style={{ fontSize: '11px', color: '#71717a' }}>
                      {fmtTag} · {item.loja} · {rotuloCaixa}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      className="tabularNums"
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: '#ffffff',
                      }}
                    >
                      {precoFmt}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveItem && onRemoveItem(itemKey)}
                      aria-label={`Remover ${item.titulo} da sacola`}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '7px',
                        backgroundColor: '#27272a',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé: Inputs Opcionais e CTA */}
        {itens.length > 0 && (
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #232328',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nome (opcional)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="fieldInput"
                style={{ padding: '0 12px' }}
              />
              <input
                type="text"
                placeholder="Bairro (opcional)"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="fieldInput"
                style={{ padding: '0 12px' }}
              />
            </div>

            <div
              className="tabularNums"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 0',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
                Total
              </span>
              <strong style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                {totalFmt}
              </strong>
            </div>

            <button
              type="button"
              disabled={validando}
              onClick={handleFinalizarWhatsApp}
              style={{
                width: '100%',
                minHeight: '48px',
                borderRadius: '10px',
                backgroundColor: '#25D366',
                border: 'none',
                color: '#050506',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: validando ? 'wait' : 'pointer',
                opacity: validando ? 0.7 : 1,
              }}
            >
              <FaWhatsapp size={20} />
              <span>{validando ? 'Verificando estoque...' : 'Enviar pedido no WhatsApp'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
