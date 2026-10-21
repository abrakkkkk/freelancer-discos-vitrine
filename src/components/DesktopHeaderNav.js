'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';
import { PiVinylRecord } from 'react-icons/pi';
import { MdStorefront } from 'react-icons/md';
import CartDrawer from './CartDrawer';
import { getCartItemKey } from '@/utils/cartUtils';

const CART_STORAGE_KEY = 'freelancer_vitrine_cart';

export default function DesktopHeaderNav({ cartCount, onOpenCart }) {
  const pathname = usePathname();
  const isCatalogo = pathname === '/' || pathname.startsWith('/catalogo');
  const isLojas = pathname.startsWith('/lojas');

  const isStandalone = typeof onOpenCart !== 'function';
  const [localCart, setLocalCart] = useState([]);
  const [isLocalDrawerOpen, setIsLocalDrawerOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isStandalone) setLocalCart(parsed);
        } else if (isStandalone) {
          setLocalCart([]);
        }
      } catch (_) {}
    };

    load();
    window.addEventListener('storage', load);
    window.addEventListener('cartChange', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('cartChange', load);
    };
  }, [isStandalone]);

  const saveLocalCart = (newCart) => {
    setLocalCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartChange'));
    } catch (_) {}
  };

  const handleRemoveLocalItem = (idOuChave) => {
    saveLocalCart(
      localCart.filter(
        (i) => getCartItemKey(i) !== idOuChave && i.id !== idOuChave
      )
    );
  };

  const effectiveCartCount = isStandalone ? localCart.length : (cartCount || 0);
  const handleCartClick = isStandalone
    ? () => setIsLocalDrawerOpen(true)
    : onOpenCart;

  return (
    <>
      {isStandalone && (
        <CartDrawer
          isOpen={isLocalDrawerOpen}
          onClose={() => setIsLocalDrawerOpen(false)}
          itens={localCart}
          onRemoveItem={handleRemoveLocalItem}
          onClearCart={() => saveLocalCart([])}
          onReplaceCart={saveLocalCart}
        />
      )}

      <nav aria-label="Navegação desktop" className="desktopHeaderNav">
        <Link
          href="/"
          className={`desktopNavLink ${isCatalogo ? 'desktopNavLinkActive' : ''}`}
        >
          <PiVinylRecord size={18} />
          <span>Catálogo</span>
        </Link>

        <Link
          href="/lojas"
          className={`desktopNavLink ${isLojas ? 'desktopNavLinkActive' : ''}`}
        >
          <MdStorefront size={18} />
          <span>Lojas & Caixas</span>
        </Link>

        <button
          type="button"
          onClick={handleCartClick}
          className="desktopNavCartBtn tabularNums"
          aria-label="Abrir sacola de compras"
        >
          <FiShoppingBag size={18} />
          <span>Sacola</span>
          {effectiveCartCount > 0 && (
            <span className="desktopNavCartBadge">
              {effectiveCartCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}

