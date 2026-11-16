import { getImportados } from '@/services/vitrineService';
import PaginaPrateleira, { metadadosDaPrateleira } from '@/editorial/PaginaPrateleira';

export const revalidate = 300;

const PAGINA = {
  titulo: 'Importados',
  caminho: '/importados',
  descricao: 'Discos importados à venda na Freelancer Discos.',
};

export const metadata = metadadosDaPrateleira(PAGINA);

export default async function ImportadosPage() {
  return <PaginaPrateleira {...PAGINA} itens={await getImportados()} />;
}
