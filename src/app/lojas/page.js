import Link from 'next/link';
import { MdChevronRight } from 'react-icons/md';
import { caixaService } from '@/services/caixaService';
import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

export const revalidate = 60;

export default async function LojasPage() {
  const totais = await caixaService.getTotaisLojas();

  const lojas = [
    { id: 'loja-1', nome: 'Loja 1', faixaCaixas: 'Caixas 1 a 55', total: totais['Loja 1'] || 0 },
    { id: 'loja-2', nome: 'Loja 2', faixaCaixas: 'Caixas 1B a 20B', total: totais['Loja 2'] || 0 },
  ];

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

      <div className="lojasGridContainer">
        {lojas.map((lj) => (
          <Link
            key={lj.id}
            href={`/lojas/${lj.id}`}
            className="productCard tabularNums"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              textDecoration: 'none',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>{lj.nome}</h2>
              <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '3px' }}>
                {lj.faixaCaixas} ·{' '}
                <strong style={{ color: '#ffffff', fontWeight: 600 }}>
                  {lj.total.toLocaleString('pt-BR')}
                </strong>{' '}
                {lj.total === 1 ? 'item' : 'itens'}
              </p>
            </div>
            <MdChevronRight size={24} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
