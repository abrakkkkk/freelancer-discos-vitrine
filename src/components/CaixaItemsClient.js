'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/components/CartProvider';
import { getCartItemKey } from '@/utils/cartUtils';

export default function CaixaItemsClient({ itens = [], rotuloCaixa, nomeLoja }) {
  const [detailItem, setDetailItem] = useState(null);
  const [buscaInterna, setBuscaInterna] = useState('');
  const { estaNaSacola, adicionar } = useCart();

  const handleAddToCart = (item) => {
    adicionar({ ...item, categoria: item.categoria || 'discos' });
  };

  const itensFiltrados = useMemo(() => {
    const termo = buscaInterna.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((i) => {
      const alvo = `${i.artista || ''} ${i.titulo || ''} ${i.observacao || ''} ${i.ano || ''}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [itens, buscaInterna]);

  return (
    <>
      {itens.length > 6 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiSearch
              size={18}
              color="#8a8a93"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            />
            <input
              type="search"
              value={buscaInterna}
              onChange={(e) => setBuscaInterna(e.target.value)}
              placeholder="Buscar nesta caixa"
              aria-label={`Buscar dentro da ${rotuloCaixa}`}
              className="fieldInput"
            />
            {buscaInterna && (
              <button
                type="button"
                onClick={() => setBuscaInterna('')}
                aria-label="Limpar busca na caixa"
                className="inputClearBtn"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          {buscaInterna && (
            <p className="tabularNums" style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '8px' }}>
              {itensFiltrados.length.toLocaleString('pt-BR')} de {itens.length.toLocaleString('pt-BR')} itens
            </p>
          )}
        </div>
      )}

      {itensFiltrados.length === 0 ? (
        <div style={{ padding: '40px 8px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: '#e4e4e7', fontWeight: 600 }}>
            {itens.length === 0
              ? 'Esta caixa está vazia no momento'
              : 'Nenhum item corresponde à busca nesta caixa'}
          </p>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            {itens.length === 0
              ? `Nenhum item cadastrado nesta caixa para ${nomeLoja}.`
              : 'Tente limpar o filtro de busca acima.'}
          </p>
        </div>
      ) : (
        <div className="catalogGrid">
          {itensFiltrados.map((item) => {
            const itemKey = getCartItemKey(item);
            return (
              <ProductCard
                key={itemKey}
                item={item}
                tipo={item.categoria || 'discos'}
                isInCart={estaNaSacola(item)}
                onAddToCart={handleAddToCart}
                onOpenDetail={(i) => setDetailItem(i)}
              />
            );
          })}
        </div>
      )}

      {/* Detalhe do Produto */}
      <ProductDetailSheet
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        isInCart={detailItem ? estaNaSacola(detailItem) : false}
        onAddToCart={handleAddToCart}
        tipo={detailItem?.categoria || 'discos'}
      />

      <BottomNav />
    </>
  );
}
