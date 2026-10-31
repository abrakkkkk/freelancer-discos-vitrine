import BottomNav from '@/components/BottomNav';
import CompartilharClient from '@/components/CompartilharClient';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

export const metadata = {
  title: 'Compartilhar',
};

export default function CompartilharPage() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.jpg" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Compartilhar</h1>
            <p className="headerSubtitle">Mostre o QR code ou envie o link</p>
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <CompartilharClient />

      <BottomNav />
    </div>
  );
}
