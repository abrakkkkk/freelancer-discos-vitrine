import CatalogoEditorial from '@/editorial/CatalogoEditorial';
import { compartilhamento } from '@/utils/seo';
import { dadosDoSite, JsonLd } from '@/utils/dadosEstruturados';

// Filtros e busca ficam na query (?loja=, ?busca=): o endereço oficial é sempre a raiz.
export const metadata = {
  alternates: { canonical: '/' },
  ...compartilhamento({ titulo: 'Freelancer Discos — Vitrine do Estoque', caminho: '/' }),
};

export default function Inicio() {
  return (
    <>
      <JsonLd dados={dadosDoSite()} />
      <CatalogoEditorial />
    </>
  );
}
