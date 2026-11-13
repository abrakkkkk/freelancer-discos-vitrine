import CatalogoEditorial from '@/editorial/CatalogoEditorial';
import VitrineLoja, { FaixaServico } from '@/editorial/VitrineLoja';
import { getVitrine } from '@/services/vitrineService';
import { compartilhamento } from '@/utils/seo';
import { dadosDoSite, JsonLd } from '@/utils/dadosEstruturados';

// Filtros e busca ficam na query (?loja=, ?busca=): o endereço oficial é sempre a raiz.
export const metadata = {
  alternates: { canonical: '/' },
  ...compartilhamento({ titulo: 'Freelancer Discos — Discos de vinil, CDs e DVDs', caminho: '/' }),
};

// As prateleiras são atualizadas a cada 5 minutos.
export const revalidate = 300;

// No computador: faixa de serviço, abertura e prateleiras acima do catálogo. No celular, só o catálogo.
export default async function Inicio() {
  const vitrine = await getVitrine();
  return (
    <>
      <JsonLd dados={dadosDoSite()} />
      <FaixaServico />
      <CatalogoEditorial className="edInicio" vitrine={<VitrineLoja vitrine={vitrine} />} />
    </>
  );
}
