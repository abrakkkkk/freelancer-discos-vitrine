'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';
import { PiVinylRecord } from 'react-icons/pi';
import { MdStorefront } from 'react-icons/md';
import { useCart } from './CartProvider';

export default function DesktopHeaderNav() {
  const pathname = usePathname();
  const isCatalogo = pathname === '/' || pathname.startsWith('/catalogo');
  const isLojas = pathname.startsWith('/lojas');
  const { quantidade, abrir } = useCart();

  return (
    <nav aria-label="Navegação desktop" className="desktopHeaderNav">
      <Link
        href="/"
        aria-current={isCatalogo ? 'page' : undefined}
        className={`desktopNavLink ${isCatalogo ? 'desktopNavLinkActive' : ''}`}
      >
        <PiVinylRecord size={18} />
        <span>Catálogo</span>
      </Link>

      <Link
        href="/lojas"
        aria-current={isLojas ? 'page' : undefined}
        className={`desktopNavLink ${isLojas ? 'desktopNavLinkActive' : ''}`}
      >
        <MdStorefront size={18} />
        <span>Lojas & Caixas</span>
      </Link>

      <button
        type="button"
        onClick={abrir}
        className="desktopNavCartBtn tabularNums"
        aria-label={
          quantidade > 0
            ? `Abrir sacola, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`
            : 'Abrir sacola'
        }
      >
        <FiShoppingBag size={18} />
        <span>Sacola</span>
        {quantidade > 0 && <span className="desktopNavCartBadge">{quantidade}</span>}
      </button>
    </nav>
  );
}
