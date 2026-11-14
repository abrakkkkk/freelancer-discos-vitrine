import CatalogoEditorial from '@/editorial/CatalogoEditorial';
import VitrineLoja from '@/editorial/VitrineLoja';
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

// Computador: abertura e prateleiras acima do catálogo.
// Celular: abertura compacta em cima; prateleiras depois da busca. A faixa vem do layout.
export default async function Inicio() {
  const vitrine = await getVitrine();
  return (
    <>
      <JsonLd dados={dadosDoSite()} />
      <CatalogoEditorial className="edInicio edInicioMobile" vitrineNoMeio vitrine={<VitrineLoja vitrine={vitrine} />} />
    </>
  );
}
