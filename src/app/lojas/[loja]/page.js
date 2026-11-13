import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { caixaService } from '@/services/caixaService';
import { nomeLojaPorSlug } from '@/utils/lojas';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { ed } from '@/editorial/rotas';
import GradeCaixasEditorial from '@/editorial/GradeCaixasEditorial';
import { compartilhamento } from '@/utils/seo';
import { JsonLd, trilha } from '@/utils/dadosEstruturados';
import Botao from '@/components/Botao';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { loja: lojaSlug } = await params;
  const nomeLoja = nomeLojaPorSlug(lojaSlug);
  return nomeLoja
    ? {
        title: `${nomeLoja} · Caixas`,
        alternates: { canonical: `/lojas/${lojaSlug}` },
        ...compartilhamento({
          titulo: `${nomeLoja} · Freelancer Discos`,
          descricao: `As caixas da ${nomeLoja} da Freelancer Discos, com o que tem em cada uma.`,
          caminho: `/lojas/${lojaSlug}`,
        }),
      }
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
      <JsonLd
        dados={trilha([
          ['Início', '/'],
          ['Caixas', '/lojas'],
          [nomeLoja, `/lojas/${lojaSlug}`],
        ])}
      />
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Botao href={ed('/lojas')} icone aria-label="Voltar para Lojas">
            <FiArrowLeft size={19} />
          </Botao>
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
