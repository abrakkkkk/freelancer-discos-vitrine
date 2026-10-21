import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { caixaService } from '@/services/caixaService';
import LojaCaixasGridClient from '@/components/LojaCaixasGridClient';
import BottomNav from '@/components/BottomNav';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';

export const revalidate = 60;

export default async function LojaCaixasPage({ params }) {
  const { loja: lojaSlug } = await params;

  let nomeLoja = '';
  if (lojaSlug === 'loja-1') nomeLoja = 'Loja 1';
  else if (lojaSlug === 'loja-2') nomeLoja = 'Loja 2';
  else notFound();

  const caixas = await caixaService.getCaixasComContagem(nomeLoja);
  const totalItensLoja = caixas.reduce((acc, c) => acc + (c.total || 0), 0);

  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Link href="/lojas" aria-label="Voltar para Lojas" className="headerBackBtn">
            <FiArrowLeft size={19} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">{nomeLoja}</h1>
            <p className="headerSubtitle tabularNums">
              {caixas.length} caixas · {totalItensLoja.toLocaleString('pt-BR')} itens
            </p>
          </div>
        </div>

        <DesktopHeaderNav />
      </header>

      <LojaCaixasGridClient caixas={caixas} lojaSlug={lojaSlug} nomeLoja={nomeLoja} />

      <BottomNav />
    </div>
  );
}
