import { BarraEditorial } from '@/editorial/NavEditorial';
import { NavDesktopEditorial } from '@/editorial/NavEditorial';

// Mesma estrutura de lojas/page.js, para a página não "pular" quando carregar.
export default function LojasLoading() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <p className="headerTitle">Caixas</p>
            <p className="headerSubtitle">Escolha a loja e a caixa</p>
          </div>
        </div>

        <NavDesktopEditorial />
      </header>

      <div className="lojasGridContainer" aria-busy="true" aria-label="Carregando lojas">
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
        <div className="skeletonBlock" style={{ height: '76px', width: '100%' }} />
      </div>

      <BarraEditorial />
    </div>
  );
}
