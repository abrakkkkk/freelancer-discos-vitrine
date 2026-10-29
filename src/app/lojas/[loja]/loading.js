import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

// Mesma estrutura de [loja]/page.js, para a página não "pular" quando carregar.
export default function LojaCaixasLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div className="skeletonBlock" style={{ width: '44px', height: '44px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeletonBlock" style={{ width: '110px', height: '20px' }} />
            <div className="skeletonBlock" style={{ width: '160px', height: '14px' }} />
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <div
        aria-busy="true"
        aria-label="Carregando caixas"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div className="skeletonBlock" style={{ height: '44px', width: '100%' }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeletonBlock" style={{ height: '78px' }} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
