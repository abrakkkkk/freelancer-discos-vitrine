import { FiArrowLeft } from 'react-icons/fi';
import Botao from '@/components/Botao';
import { compartilhamento } from '@/utils/seo';
import { JsonLd, trilha } from '@/utils/dadosEstruturados';
import CaixaEditorialClient from './CaixaEditorialClient';
import { NavDesktopEditorial } from './NavEditorial';

export function metadadosDaPrateleira({ titulo, descricao, caminho }) {
  return {
    title: titulo,
    alternates: { canonical: caminho },
    ...compartilhamento({ titulo: `${titulo} · Freelancer Discos`, descricao, caminho }),
  };
}

// Página de uma prateleira da página inicial, com a lista completa.
export default function PaginaPrateleira({ titulo, caminho, itens }) {
  return (
    <div className="pageContainer edPrateleiraPagina">
      <JsonLd dados={trilha([['Início', '/'], [titulo, caminho]])} />
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Botao href="/" icone aria-label="Voltar para o início">
            <FiArrowLeft size={19} />
          </Botao>
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">{titulo}</h1>
            <p className="headerSubtitle tabularNums">
              {itens.length.toLocaleString('pt-BR')} {itens.length === 1 ? 'disco' : 'discos'}
            </p>
          </div>
        </div>

        <NavDesktopEditorial />
      </header>

      <CaixaEditorialClient itens={itens} porLetra={false} mostrarCaixa ondeBusca="nesta lista" />
    </div>
  );
}
