import { Outfit, Figtree } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Freelancer Discos — Vitrine do Catálogo',
    // Páginas internas: "Caixa 5 · Loja 1 · Freelancer Discos"
    template: '%s · Freelancer Discos',
  },
  description: 'Catálogo de discos de vinil, CDs, DVDs e fitas VHS da Freelancer Discos',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Necessário para env(safe-area-inset-*) funcionar no iPhone (home indicator).
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${figtree.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
