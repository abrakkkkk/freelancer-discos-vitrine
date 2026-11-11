'use client';

import { useEffect, useRef, useState } from 'react';
import AlbumCover from './AlbumCover';
import { formatCaixa } from '@/utils/stringUtils';
import Localizacao from './Localizacao';
import { generateWhatsAppUrl, getCartItemKey } from '@/utils/cartUtils';
import { useModalDialog } from '@/hooks/useModalDialog';
import { FiX, FiTrash2, FiInfo, FiRotateCcw } from 'react-icons/fi';
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
  // Última remoção feita pelo cliente, com a sacola de antes, para o botão "Desfazer".
  const [desfazer, setDesfazer] = useState(null);
  const panelRef = useRef(null);
  useModalDialog(isOpen, onClose, panelRef);

  // Avisos valem só para a sacola aberta: ao reabrir, começa sem eles.
  useEffect(() => {
    if (!isOpen) {
      setDesfazer(null);
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const removerComDesfazer = (texto, acao) => {
    setDesfazer({ texto, itensAntes: itens });
    setFeedback(null);
    acao();
  };

  const handleLimpar = () => {
    const qtd = itens.length;
    removerComDesfazer(
      `${qtd} ${qtd === 1 ? 'item removido' : 'itens removidos'} da sacola.`,
      onClearCart
    );
  };

  const handleRemover = (item, itemKey) => {
    removerComDesfazer(`"${item.titulo}" saiu da sacola.`, () => onRemoveItem && onRemoveItem(itemKey));
  };

  const handleDesfazer = () => {
    if (desfazer && onReplaceCart) onReplaceCart(desfazer.itensAntes);
    setDesfazer(null);
  };

  const total = itens.reduce((acc, item) => acc + (Number(item.preco) || 0), 0);
  const totalFmt = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Depois do await da validação, o Safari do iPhone pode bloquear a nova aba.
  // Se for bloqueada, abre o WhatsApp na própria aba (a sacola continua salva).
  const abrirWhatsApp = (urlWa) => {
    const janela = window.open(urlWa, '_blank');
    if (janela) {
      janela.opener = null;
      onClose();
    } else {
      window.location.href = urlWa;
    }
  };

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
        // Se o estoque não responder logo, segue para o WhatsApp sem remover nada
        // (a disponibilidade é confirmada lá).
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        const indisponiveisKeys = new Set(data.indisponiveisKeys || []);
        const indisponiveisIds = new Set(data.indisponiveis || []);

        const qtdIndisponiveis =
          indisponiveisKeys.size > 0 ? indisponiveisKeys.size : indisponiveisIds.size;

        if (qtdIndisponiveis > 0) {
          const disponivel = (i) =>
            indisponiveisKeys.size > 0
              ? !indisponiveisKeys.has(getCartItemKey(i))
              : !indisponiveisIds.has(i.id);
          const restantes = itens.filter(disponivel);
          const removidos = itens.filter((i) => !disponivel(i));
          if (onReplaceCart) onReplaceCart(restantes);

          // O aviso fica até o cliente fechar: ele precisa saber quais discos saíram.
          setDesfazer(null);
          setFeedback({
            tipo: 'aviso',
            texto:
              removidos.length === 1
                ? 'Este item não está mais disponível e saiu da sacola:'
                : `Estes ${removidos.length} itens não estão mais disponíveis e saíram da sacola:`,
            titulos: removidos.map((i) => [i.artista, i.titulo].filter(Boolean).join(' - ')),
          });
          setValidando(false);
          return;
        }
      }

      abrirWhatsApp(generateWhatsAppUrl(itens, nome, bairro));
    } catch (err) {
      console.error('Erro ao validar sacola:', err);
      abrirWhatsApp(generateWhatsAppUrl(itens, nome, bairro));
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="cartDrawerBackdrop">
      {/* Fundo: o site continua por trás, desfocado e escurecido. */}
      <div onClick={onClose} className="cartFundo" />

      {/* Painel da Sacola */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Sua Sacola"
        className="cartDrawerPanel"
      >
        {/* Cabeçalho */}
        <div className="cartTopo">
          <div className="cartTopoTitulo">
            <h2>Sua sacola</h2>
            <span className="tabularNums cartContagem">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {itens.length > 1 && onClearCart && (
              <button
                type="button"
                onClick={handleLimpar}
                className="textBtn"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar sacola"
              className="cartIconeBtn"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        {/* Avisos: remoção com desfazer e itens que já foram vendidos */}
        <div role="status" aria-live="polite">
          {desfazer && (
            <div className="cartAviso cartAvisoDesfazer">
              <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{desfazer.texto}</span>
              <button type="button" onClick={handleDesfazer} className="cartAvisoBtn">
                <FiRotateCcw size={15} aria-hidden="true" />
                Desfazer
              </button>
            </div>
          )}

          {feedback && (
            <div className="cartAviso cartAvisoVendido">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600 }}>{feedback.texto}</p>
                {feedback.titulos?.length > 0 && (
                  <ul style={{ marginTop: '4px', paddingLeft: '18px', overflowWrap: 'anywhere' }}>
                    {feedback.titulos.map((t, idx) => (
                      <li key={`${t}-${idx}`}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                aria-label="Fechar aviso"
                className="cartAvisoBtn cartAvisoFechar"
              >
                <FiX size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Itens */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
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
                color: 'var(--text-dim)',
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
                <div key={itemKey} className="cartItem">
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
                    {item.artista && <p className="cartItemArtista">{item.artista}</p>}
                    <h3 className="cartItemTitulo">{item.titulo}</h3>
                    {/* Na sacola a localização vira lista de separação: mesmo bloco do card. */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', minWidth: 0 }}>
                      <Localizacao caixa={item.caixa} loja={item.loja} tamanho="sacola" />
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{fmtTag}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span className="tabularNums cartItemPreco">{precoFmt}</span>

                    <button
                      type="button"
                      onClick={() => handleRemover(item, itemKey)}
                      aria-label={`Remover ${item.titulo} da sacola`}
                      className="cartIconeBtn"
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
            {/* Rótulos visíveis: o texto de exemplo some quando o cliente começa a digitar. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label className="cartCampo">
                <span>Seu nome (opcional)</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="fieldInput"
                  style={{ padding: '0 12px' }}
                />
              </label>
              <label className="cartCampo">
                <span>Bairro (opcional)</span>
                <input
                  type="text"
                  autoComplete="address-level3"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="fieldInput"
                  style={{ padding: '0 12px' }}
                />
              </label>
            </div>

            {/* Disponibilidade: o estoque é físico, a loja confirma na conversa. */}
            <p role="note" className="cartNota">
              <FiInfo size={14} aria-hidden="true" />
              A loja confirma a disponibilidade no WhatsApp.
            </p>

            {/* Total e Botão WhatsApp */}
            <div className="tabularNums cartTotal">
              <span>Total</span>
              <strong>{totalFmt}</strong>
            </div>

            <button
              type="button"
              disabled={validando}
              aria-busy={validando}
              onClick={handleFinalizarWhatsApp}
              style={{
                width: '100%',
                minHeight: '52px',
                borderRadius: '10px',
                // Estado "verificando" com verde mais escuro e sólido (sem opacidade)
                backgroundColor: validando ? '#1a9e4f' : '#25D366',
                border: 'none',
                color: '#050506',
                fontFamily: 'var(--font-editorial), var(--font-title)',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: validando ? 'wait' : 'pointer',
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
