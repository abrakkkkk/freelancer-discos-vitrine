import CompartilharClient from '@/components/CompartilharClient';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { compartilhamento } from '@/utils/seo';

export const metadata = {
  title: 'Compartilhar',
  alternates: { canonical: '/compartilhar' },
  ...compartilhamento({
    titulo: 'Freelancer Discos — Discos de vinil, CDs e DVDs',
    descricao: 'QR code e link da vitrine da Freelancer Discos, para mandar no WhatsApp ou mostrar na loja.',
    caminho: '/compartilhar',
  }),
};

export default function CompartilharEditorialPage() {
  return (
    <div className="pageContainer edPaginaCompartilhar">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Compartilhar</h1>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      <CompartilharClient />

      <BarraEditorial />
    </div>
  );
}
