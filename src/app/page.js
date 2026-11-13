import { compartilhamento } from '@/utils/seo';

export { default } from '@/editorial/CatalogoEditorial';

// Filtros e busca ficam na query (?loja=, ?q=): o endereço oficial é sempre a raiz.
export const metadata = {
  alternates: { canonical: '/' },
  ...compartilhamento({ titulo: 'Freelancer Discos — Vitrine do Estoque', caminho: '/' }),
};
