'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiVinylRecord } from 'react-icons/pi';
import { MdStorefront } from 'react-icons/md';
import { FiShare2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from './CartProvider';

export default function BottomNav() {
  const pathname = usePathname();
  const isCatalogo = pathname === '/' || pathname.startsWith('/catalogo');
  const isLojas = pathname.startsWith('/lojas');
  const isCompartilhar = pathname.startsWith('/compartilhar');
  const { quantidade: effectiveCartCount, abrir: handleCartClick } = useCart();

  return (
    <>
      <nav
        aria-label="Navegação inferior"
        className="bottomNavMobile"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#111114',
          borderTop: '1px solid #232328',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            height: 'var(--bottom-nav-height, 64px)',
          }}
        >
          <Link
            href="/"
            aria-current={isCatalogo ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '44px',
              color: isCatalogo ? '#ffffff' : '#a1a1aa',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 700,
              position: 'relative',
            }}
          >
            {isCatalogo && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '36px',
                  height: '2px',
                  backgroundColor: '#8b1e1e',
                  borderRadius: '0 0 2px 2px',
                }}
              />
            )}
            <PiVinylRecord size={22} color={isCatalogo ? '#e4e4e7' : '#a1a1aa'} />
            <span>Catálogo</span>
          </Link>

          <Link
            href="/lojas"
            aria-current={isLojas ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '44px',
              color: isLojas ? '#ffffff' : '#a1a1aa',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 700,
              position: 'relative',
            }}
          >
            {isLojas && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '36px',
                  height: '2px',
                  backgroundColor: '#8b1e1e',
                  borderRadius: '0 0 2px 2px',
                }}
              />
            )}
            <MdStorefront size={22} color={isLojas ? '#e4e4e7' : '#a1a1aa'} />
            <span>Caixas & Lojas</span>
          </Link>

          <Link
            href="/compartilhar"
            aria-current={isCompartilhar ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '44px',
              color: isCompartilhar ? '#ffffff' : '#a1a1aa',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 700,
              position: 'relative',
            }}
          >
            {isCompartilhar && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '36px',
                  height: '2px',
                  backgroundColor: '#8b1e1e',
                  borderRadius: '0 0 2px 2px',
                }}
              />
            )}
            <FiShare2 size={21} color={isCompartilhar ? '#e4e4e7' : '#a1a1aa'} />
            <span>Compartilhar</span>
          </Link>

          <button
            type="button"
            onClick={handleCartClick}
            className="tabularNums"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              minHeight: '44px',
              color: effectiveCartCount > 0 ? '#ffffff' : '#a1a1aa',
              backgroundColor: '#111114',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <FiShoppingBag size={21} color={effectiveCartCount > 0 ? '#ffffff' : '#a1a1aa'} />
              {effectiveCartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-10px',
                    backgroundColor: '#8b1e1e',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    minWidth: '17px',
                    textAlign: 'center',
                  }}
                >
                  {effectiveCartCount}
                </span>
              )}
            </div>
            <span>Sacola</span>
          </button>
        </div>
      </nav>
    </>
  );
}
