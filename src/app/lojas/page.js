import Link from 'next/link';
import { MdChevronRight } from 'react-icons/md';
import { caixaService } from '@/services/caixaService';
import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

export const revalidate = 60;

export const metadata = {
  title: 'Lojas e caixas',
};

export default async function LojasPage() {
  // Mesma fonte da página de cada loja: o número de caixas e de itens sempre bate.
  // (Antes a faixa era fixa no código: "Caixas 1B a 20B", mas a Loja 2 já vai além.)
  const [caixasLoja1, caixasLoja2] = await Promise.all([
    caixaService.getCaixasComContagem('Loja 1'),
    caixaService.getCaixasComContagem('Loja 2'),
  ]);
  const resumo = (caixas) => ({
    caixas: caixas.length,
    total: caixas.reduce((acc, c) => acc + (c.total || 0), 0),
  });

  const lojas = [
    { id: 'loja-1', nome: 'Loja 1', ...resumo(caixasLoja1) },
    { id: 'loja-2', nome: 'Loja 2', ...resumo(caixasLoja2) },
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
            className={`productCard tabularNums ${lj.id === 'loja-2' ? 'lojaCardLoja2' : 'lojaCardLoja1'}`}
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
                {lj.caixas} caixas ·{' '}
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
