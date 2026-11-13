import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { caixaService } from '@/services/caixaService';
import { nomeLojaPorSlug } from '@/utils/lojas';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { ed } from '@/editorial/rotas';
import GradeCaixasEditorial from '@/editorial/GradeCaixasEditorial';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { loja: lojaSlug } = await params;
  const nomeLoja = nomeLojaPorSlug(lojaSlug);
  return nomeLoja
    ? { title: `${nomeLoja} · Caixas`, alternates: { canonical: `/lojas/${lojaSlug}` } }
    : {};
}

export default async function LojaEditorialPage({ params }) {
  const { loja: lojaSlug } = await params;
  const nomeLoja = nomeLojaPorSlug(lojaSlug);
  if (!nomeLoja) notFound();

  const caixas = await caixaService.getCaixasComContagem(nomeLoja);
  const totalItens = caixas.reduce((acc, c) => acc + (c.total || 0), 0);

  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Link href={ed('/lojas')} aria-label="Voltar para Lojas" className="headerBackBtn">
            <FiArrowLeft size={19} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1
              className="headerTitle edTituloLoja"
              style={{ '--cor-loja': nomeLoja === 'Loja 2' ? 'var(--loja-2)' : 'var(--loja-1)' }}
            >
              {nomeLoja}
            </h1>
            <p className="headerSubtitle tabularNums">
              {caixas.length} caixas, {totalItens.toLocaleString('pt-BR')} itens
            </p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      <GradeCaixasEditorial caixas={caixas} lojaSlug={lojaSlug} nomeLoja={nomeLoja} />

      <BarraEditorial />
    </div>
  );
}
