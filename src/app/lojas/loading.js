import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

// Mesma estrutura de lojas/page.js, para a página não "pular" quando carregar.
export default function LojasLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.jpg" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Lojas</h1>
            <p className="headerSubtitle">Escolha uma loja para ver as caixas</p>
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <div className="lojasGridContainer" aria-busy="true" aria-label="Carregando lojas">
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
      </div>

      <BottomNav />
    </div>
  );
}
