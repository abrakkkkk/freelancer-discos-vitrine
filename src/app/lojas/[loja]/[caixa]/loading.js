import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

// Mesma estrutura de [caixa]/page.js (cabeçalho, busca e grade), para a página não "pular".
export default function CaixaDetalheLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div className="skeletonBlock" style={{ width: '44px', height: '44px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeletonBlock" style={{ width: '120px', height: '20px' }} />
            <div className="skeletonBlock" style={{ width: '150px', height: '14px' }} />
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <div className="skeletonBlock" style={{ height: '44px', width: '100%', marginBottom: '12px' }} />

      <div className="catalogGrid" aria-busy="true" aria-label="Carregando itens da caixa">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="skeletonCard">
            <div className="skeletonBlock" style={{ width: '100%', aspectRatio: '1 / 1' }} />
            <div className="skeletonBlock" style={{ width: '60%', height: '12px' }} />
            <div className="skeletonBlock" style={{ width: '90%', height: '16px' }} />
            <div className="skeletonBlock" style={{ width: '45%', height: '24px', marginTop: '4px' }} />
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
