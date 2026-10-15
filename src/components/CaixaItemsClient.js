'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';

const CART_STORAGE_KEY = 'freelancer_vitrine_cart';

export default function CaixaItemsClient({ itens = [], rotuloCaixa, nomeLoja }) {
  const [detailItem, setDetailItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (_) {}
  };

  const handleAddToCart = (item) => {
    const jaExiste = cart.some((i) => i.id === item.id);
    if (jaExiste) {
      setIsCartOpen(true);
      return;
    }
    saveCart([...cart, item]);
  };

  const handleRemoveFromCart = (id) => {
    saveCart(cart.filter((i) => i.id !== id));
  };

  const cartIds = new Set(cart.map((i) => i.id));

  return (
    <>
      {itens.length === 0 ? (
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            backgroundColor: '#151518',
            border: '1px solid #232328',
            borderRadius: '12px',
          }}
        >
          <p style={{ fontSize: '15px', color: '#e4e4e7', fontWeight: 600 }}>
            Esta caixa está vazia no momento
          </p>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            Nenhum item cadastrado nesta caixa para {nomeLoja}.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
          {itens.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              tipo={item.categoria || 'discos'}
              isInCart={cartIds.has(item.id)}
              onAddToCart={handleAddToCart}
              onOpenDetail={(i) => setDetailItem(i)}
            />
          ))}
        </div>
      )}

      {/* Detalhe do Produto */}
      <ProductDetailSheet
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        isInCart={detailItem ? cartIds.has(detailItem.id) : false}
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
