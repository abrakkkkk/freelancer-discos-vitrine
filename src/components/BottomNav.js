'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiVinylRecord } from 'react-icons/pi';
import { MdStorefront } from 'react-icons/md';
import { FiShoppingBag } from 'react-icons/fi';

export default function BottomNav({ cartCount = 0, onOpenCart }) {
  const pathname = usePathname();
  const isCatalogo = pathname === '/' || pathname.startsWith('/catalogo');
  const isLojas = pathname.startsWith('/lojas');

  return (
    <nav
      aria-label="Navegação inferior"
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 'var(--bottom-nav-height, 64px)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            minWidth: '64px',
            minHeight: '44px',
            color: isCatalogo ? '#ffffff' : '#71717a',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <PiVinylRecord size={22} color={isCatalogo ? '#8b1e1e' : '#71717a'} />
          <span>Catálogo</span>
        </Link>

        <Link
          href="/lojas"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            minWidth: '64px',
            minHeight: '44px',
            color: isLojas ? '#ffffff' : '#71717a',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <MdStorefront size={22} color={isLojas ? '#8b1e1e' : '#71717a'} />
          <span>Lojas</span>
        </Link>

        <button
          type="button"
          onClick={onOpenCart}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            minWidth: '64px',
            minHeight: '44px',
            color: cartCount > 0 ? '#ffffff' : '#71717a',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <FiShoppingBag size={21} color={cartCount > 0 ? '#8b1e1e' : '#71717a'} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: '#8b1e1e',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
          <span>Sacola</span>
        </button>
      </div>
    </nav>
  );
}
