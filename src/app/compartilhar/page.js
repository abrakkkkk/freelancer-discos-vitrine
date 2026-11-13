import CompartilharClient from '@/components/CompartilharClient';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';

export const metadata = {
  title: 'Compartilhar',
  alternates: { canonical: '/compartilhar' },
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
