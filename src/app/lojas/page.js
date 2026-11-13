import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';
import { caixaService } from '@/services/caixaService';
import { getDestaquesPorLoja } from '@/services/destaquesService';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { ed } from '@/editorial/rotas';
import { compartilhamento } from '@/utils/seo';

export const revalidate = 60;

export const metadata = {
  title: 'Lojas e caixas',
  alternates: { canonical: '/lojas' },
  ...compartilhamento({
    titulo: 'Lojas e caixas · Freelancer Discos',
    descricao: 'Escolha a loja e a caixa: o estoque da Freelancer Discos organizado como nas prateleiras.',
    caminho: '/lojas',
  }),
};

const COR_LOJA = { 'loja-1': 'var(--loja-1)', 'loja-2': 'var(--loja-2)' };

export default async function LojasEditorialPage() {
  const [caixasLoja1, caixasLoja2, destaques] = await Promise.all([
    caixaService.getCaixasComContagem('Loja 1'),
    caixaService.getCaixasComContagem('Loja 2'),
    getDestaquesPorLoja(),
  ]);
  const resumo = (caixas) => ({
    caixas: caixas.length,
    total: caixas.reduce((acc, c) => acc + (c.total || 0), 0),
    primeira: caixas[0]?.label,
    ultima: caixas[caixas.length - 1]?.label,
  });

  const lojas = [
    { id: 'loja-1', nome: 'Loja 1', ...resumo(caixasLoja1) },
    { id: 'loja-2', nome: 'Loja 2', ...resumo(caixasLoja2) },
  ];

  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Caixas</h1>
            <p className="headerSubtitle">Escolha a loja e a caixa</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      {/* Cada loja como o cabeçalho de caixa do catálogo: nome grande com o traço na cor
          da loja e o resumo numa linha. A linha inteira leva às caixas. */}
      <div className="edLojas">
        {lojas.map((lj) => (
          // No celular o bloco não gera caixa (display: contents): só o link da loja aparece.
          <div key={lj.id} className="edLojaBloco">
          <Link
            href={ed(`/lojas/${lj.id}`)}
            className="edLoja tabularNums"
            style={{ '--cor-loja': COR_LOJA[lj.id] }}
          >
            <span className="edLojaTopo">
              <h2 className="edLojaNome">{lj.nome}</h2>
              <span className="edLojaVer">
                Ver caixas
                <FiChevronRight size={16} aria-hidden="true" />
              </span>
            </span>
            <p className="edLojaResumo">
              <strong>{lj.caixas}</strong> caixas · <strong>{lj.total.toLocaleString('pt-BR')}</strong>{' '}
              itens
            </p>
            {/* Capas de discos famosos que estão nesta loja: o acervo dá a cor da página. */}
            {destaques[lj.nome]?.length > 0 && (
              <span className="edLojaCapas">
                {destaques[lj.nome].map((d) => (
                  <img
                    key={d.id}
                    src={d.capa_url}
                    alt={`${d.artista} - ${d.titulo}`}
                    decoding="async"
                    className="edLojaCapa"
                  />
                ))}
              </span>
            )}
          </Link>
          </div>
        ))}
      </div>

      <BarraEditorial />
    </div>
  );
}
