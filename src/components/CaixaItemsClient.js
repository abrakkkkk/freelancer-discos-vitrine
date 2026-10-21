'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';
import { getCartItemKey } from '@/utils/cartUtils';

const CART_STORAGE_KEY = 'freelancer_vitrine_cart';

export default function CaixaItemsClient({ itens = [], rotuloCaixa, nomeLoja }) {
  const [detailItem, setDetailItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buscaInterna, setBuscaInterna] = useState('');

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) setCart(JSON.parse(stored));
        else setCart([]);
      } catch (_) {}
    };
    load();
    window.addEventListener('storage', load);
    window.addEventListener('cartChange', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('cartChange', load);
    };
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartChange'));
    } catch (_) {}
  };

  const handleAddToCart = (item) => {
    const itemComCategoria = { ...item, categoria: item.categoria || 'discos' };
    const chaveAlvo = getCartItemKey(itemComCategoria);
    const jaExiste = cart.some((i) => getCartItemKey(i) === chaveAlvo);
    if (jaExiste) {
      setIsCartOpen(true);
      return;
    }
    saveCart([...cart, itemComCategoria]);
  };

  const handleRemoveFromCart = (idOuChave) => {
    saveCart(
      cart.filter(
        (i) => getCartItemKey(i) !== idOuChave && i.id !== idOuChave
      )
    );
  };

  const itensFiltrados = useMemo(() => {
    const termo = buscaInterna.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((i) => {
      const alvo = `${i.artista || ''} ${i.titulo || ''} ${i.observacao || ''} ${i.ano || ''}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [itens, buscaInterna]);

  const cartKeys = new Set(cart.map((i) => getCartItemKey(i)));

  return (
    <>
      {itens.length > 6 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiSearch
              size={18}
              color="#71717a"
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
                isInCart={cartKeys.has(itemKey)}
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
        isInCart={detailItem ? cartKeys.has(getCartItemKey(detailItem)) : false}
        onAddToCart={handleAddToCart}
        tipo={detailItem?.categoria || 'discos'}
      />

      {/* Drawer da Sacola */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        itens={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={() => saveCart([])}
        onReplaceCart={saveCart}
      />

      <BottomNav
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </>
  );
}
