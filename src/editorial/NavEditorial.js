'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiArchiveBold, PiMapPinBold, PiQrCodeBold, PiShoppingBagOpenBold, PiVinylRecordBold } from 'react-icons/pi';
import { useCart } from '@/components/CartProvider';

import { BASE, ed } from './rotas';

function useAtivos() {
  const pathname = usePathname();
  return {
    catalogo: pathname === '/',
    lojas: pathname.startsWith(`${BASE}/lojas`),
    contato: pathname.startsWith(`${BASE}/contato`),
    compartilhar: pathname.startsWith(`${BASE}/compartilhar`),
  };
}

const ITENS = [
  { chave: 'catalogo', href: ed('/'), rotulo: 'Catálogo', Icone: PiVinylRecordBold },
  { chave: 'lojas', href: ed('/lojas'), rotulo: 'Caixas', Icone: PiArchiveBold },
  { chave: 'contato', href: ed('/contato'), rotulo: 'Contato', Icone: PiMapPinBold },
  { chave: 'compartilhar', href: ed('/compartilhar'), rotulo: 'Compartilhar', Icone: PiQrCodeBold },
];

/** Barra de baixo do celular, no estilo do teste: ícones da mesma família e rótulos condensados. */
export function BarraEditorial() {
  const ativos = useAtivos();
  const { quantidade, abrir } = useCart();

  return (
    <nav aria-label="Navegação inferior" className="bottomNavMobile edBarra">
      <div className="edBarraGrade">
        {ITENS.map(({ chave, href, rotulo, Icone }) => (
          <Link
            key={chave}
            href={href}
            aria-current={ativos[chave] ? 'page' : undefined}
            className={`edBarraItem ${ativos[chave] ? 'edBarraItemAtivo' : ''}`}
          >
            <Icone size={23} aria-hidden="true" />
            <span>{rotulo}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={abrir}
          className="edBarraItem"
          aria-label={quantidade > 0 ? `Abrir sacola, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}` : 'Abrir sacola'}
        >
          <span className="edBarraIcone">
            <PiShoppingBagOpenBold size={23} aria-hidden="true" />
            {quantidade > 0 && <span className="edBarraContagem tabularNums">{quantidade}</span>}
          </span>
          <span>Sacola</span>
        </button>
      </div>
    </nav>
  );
}

/** Menu do topo no computador, com os mesmos destinos e ícones da barra de baixo. */
export function NavDesktopEditorial() {
  const ativos = useAtivos();
  const { quantidade, abrir } = useCart();

  return (
    <nav aria-label="Navegação desktop" className="desktopHeaderNav edNavDesktop">
      {ITENS.map(({ chave, href, rotulo, Icone }) => (
        <Link
          key={chave}
          href={href}
          aria-current={ativos[chave] ? 'page' : undefined}
          className={`desktopNavLink ${ativos[chave] ? 'desktopNavLinkActive' : ''}`}
        >
          <Icone size={18} aria-hidden="true" />
          <span>{rotulo}</span>
        </Link>
      ))}
      <button
        type="button"
        onClick={abrir}
        className="desktopNavCartBtn tabularNums"
        aria-label={quantidade > 0 ? `Abrir sacola, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}` : 'Abrir sacola'}
      >
        <PiShoppingBagOpenBold size={18} aria-hidden="true" />
        <span>Sacola</span>
        {quantidade > 0 && <span className="desktopNavCartBadge">{quantidade}</span>}
      </button>
    </nav>
  );
}
