import { Figtree, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import '@/editorial/editorial.css';
import { CartProvider } from '@/components/CartProvider';
import { compartilhamento, DESCRICAO_PADRAO } from '@/utils/seo';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-editorial',
  display: 'swap',
});

export const metadata = {
  // Base dos endereços absolutos (canonical, Open Graph). Cada página declara o próprio canonical.
  metadataBase: new URL('https://freelancerdiscos.com.br'),
  title: {
    default: 'Freelancer Discos — Discos de vinil, CDs e DVDs',
    // Páginas internas: "Caixa 5 · Loja 1 · Freelancer Discos"
    template: '%s · Freelancer Discos',
  },
  description: DESCRICAO_PADRAO,
  ...compartilhamento({ titulo: 'Freelancer Discos — Discos de vinil, CDs e DVDs' }),
  appleWebApp: {
    title: 'Freelancer - Vitrine',
    statusBarStyle: 'black-translucent',
  },
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
    <html lang="pt-BR" className={`${figtree.variable} ${barlowCondensed.variable}`}>
      <body>
        <CartProvider>
          <div className="edPagina">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}
