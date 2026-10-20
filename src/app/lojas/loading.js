import BottomNav from '@/components/BottomNav';

export default function LojasLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <img src="/logo.jpg" alt="" className="headerLogo" />
        <div style={{ minWidth: 0 }}>
          <h1 className="headerTitle">Lojas</h1>
          <p className="headerSubtitle">Escolha uma loja para ver as caixas</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
      </div>

      <BottomNav />
    </div>
  );
}

