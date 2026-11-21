import { getChegaramAgora } from '@/services/vitrineService';
import PaginaPrateleira, { metadadosDaPrateleira } from '@/editorial/PaginaPrateleira';

export const revalidate = 3600;

const PAGINA = {
  titulo: 'Chegaram agora',
  caminho: '/chegaram-agora',
  descricao: 'Os discos que acabaram de chegar à Freelancer Discos.',
};

export const metadata = metadadosDaPrateleira(PAGINA);

export default async function ChegaramAgoraPage() {
  return <PaginaPrateleira {...PAGINA} itens={await getChegaramAgora()} />;
}
