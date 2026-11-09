import Link from 'next/link';
import { caixaService } from '@/services/caixaService';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { ed } from '@/editorial/rotas';

export const revalidate = 60;

export const metadata = {
  title: 'Lojas e caixas',
};

const COR_LOJA = { 'loja-1': 'var(--loja-1)', 'loja-2': 'var(--loja-2)' };

export default async function LojasEditorialPage() {
  const [caixasLoja1, caixasLoja2] = await Promise.all([
    caixaService.getCaixasComContagem('Loja 1'),
    caixaService.getCaixasComContagem('Loja 2'),
  ]);
  const resumo = (caixas) => ({
    caixas: caixas.length,
    total: caixas.reduce((acc, c) => acc + (c.total || 0), 0),
    primeira: caixas[0]?.label,
    ultima: caixas[caixas.length - 1]?.label,
  });

  const lojas = [
    { id: 'loja-1', nome: 'Loja 1', ...resumo(caixasLoja1) },
    { id: 'loja-2', nome: 'Loja 2', ...resumo(caixasLoja2) },
  ];

  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Caixas</h1>
            <p className="headerSubtitle">Escolha a loja e a caixa</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      {/* Cada loja como a capa de uma seção do catálogo: nome grande e o índice de caixas. */}
      <div className="edLojas">
        {lojas.map((lj) => (
          <Link key={lj.id} href={ed(`/lojas/${lj.id}`)} className="edLoja tabularNums">
            <span className="edLojaFio" style={{ backgroundColor: COR_LOJA[lj.id] }} aria-hidden="true" />
            <h2 className="edLojaNome">{lj.nome}</h2>
            <dl className="edLojaNumeros">
              <div>
                <dt>Caixas</dt>
                <dd>{lj.caixas}</dd>
              </div>
              <div>
                <dt>Itens</dt>
                <dd>{lj.total.toLocaleString('pt-BR')}</dd>
              </div>
            </dl>
            {lj.primeira && (
              <p className="edLojaFaixa">
                Da {lj.primeira} à {lj.ultima}
              </p>
            )}
            <span className="edLojaVer">Ver caixas</span>
          </Link>
        ))}
      </div>

      <BarraEditorial />
    </div>
  );
}
