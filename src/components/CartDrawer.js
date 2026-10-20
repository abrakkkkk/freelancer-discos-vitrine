'use client';

import { useState } from 'react';
import AlbumCover from './AlbumCover';
import { formatCaixa } from '@/utils/stringUtils';
import { generateWhatsAppUrl, getCartItemKey } from '@/utils/cartUtils';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

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
      // Validação de estoque ativo
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

      // Se todos estiverem disponíveis, abre o WhatsApp
      const urlWa = generateWhatsAppUrl(itens, nome, bairro);
      window.open(urlWa, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (err) {
      console.error('Erro ao validar sacola:', err);
      // Fallback em caso de erro de rede: abre o WhatsApp com a sacola atual
      const urlWa = generateWhatsAppUrl(itens, nome, bairro);
      window.open(urlWa, '_blank', 'noopener,noreferrer');
      onClose();
    } finally {
      setValidando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
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
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '540px',
          maxHeight: 'calc(100vh - 20px)',
          backgroundColor: '#18181c',
          borderTop: '1px solid #2d2d35',
          borderLeft: '1px solid #2d2d35',
          borderRight: '1px solid #2d2d35',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.9)',
          padding: '16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
        }}
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
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b1e1e',
                backgroundColor: '#1f1515',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #4a1919',
              }}
            >
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
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

        {/* Feedback / Aviso */}
        {feedback && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              backgroundColor: '#2e1f13',
              border: '1px solid #78481b',
              borderRadius: '8px',
              color: '#fed7aa',
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
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
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

              return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#121215',
                    border: '1px solid #232328',
                    borderRadius: '10px',
                    padding: '10px',
                  }}
                >
                  <AlbumCover
                    artista={item.artista}
                    titulo={item.titulo}
                    capaUrl={item.capa_url}
                    size={52}
                    tipo={item.categoria || 'discos'}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.artista && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#a1a1aa',
                          fontWeight: 600,
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
                        fontWeight: 600,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.titulo}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>
                      {item.loja} · {rotuloCaixa}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '6px',
                        backgroundColor: '#1c1c21',
                        border: '1px solid #2d2d35',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <FiTrash2 size={16} />
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
              gap: '12px',
            }}
          >
            {/* Campos opcionais de identificação */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="Seu Nome (opcional)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  height: '44px',
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: '#ffffff',
                  fontSize: '16px', // Previne auto-zoom no Safari/iOS
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Seu Bairro (opcional)"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                style={{
                  height: '44px',
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: '#ffffff',
                  fontSize: '16px', // Previne auto-zoom no Safari/iOS
                  outline: 'none',
                }}
              />
            </div>

            {/* Total e Botão WhatsApp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Total Estimado:</span>
              <strong style={{ fontSize: '20px', color: '#ffffff' }}>{totalFmt}</strong>
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
                color: '#000000',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: validando ? 'wait' : 'pointer',
                opacity: validando ? 0.7 : 1,
              }}
            >
              <FaWhatsapp size={20} />
              <span>{validando ? 'Verificando estoque...' : 'Finalizar no WhatsApp'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
