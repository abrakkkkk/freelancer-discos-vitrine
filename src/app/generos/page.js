import Link from 'next/link';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import Botao from '@/components/Botao';
import { supabaseServer } from '@/lib/supabaseServer';
import { contarDiscosPorGenero } from '@/services/catalogService';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { hrefDoGenero } from '@/components/SobreGenero';
import { GENEROS } from '@/utils/generos';
import { compartilhamento } from '@/utils/seo';
import { JsonLd, trilha } from '@/utils/dadosEstruturados';

// Contagens e capas: refeita no máximo a cada 10 minutos.
export const revalidate = 600;

const CAMINHO = '/generos';

export const metadata = {
  title: 'Gêneros',
  alternates: { canonical: CAMINHO },
  ...compartilhamento({
    titulo: 'Gêneros · Freelancer Discos',
    descricao: 'Discos de vinil por gênero: MPB, samba, bossa nova, rock, soul e mais.',
    caminho: CAMINHO,
  }),
};

const CAPAS_POR_GENERO = 3;

// Três capas recentes de cada gênero, para o cliente reconhecer o que tem ali.
async function capasDoGenero(id) {
  if (!supabaseServer) return [];
  const { data, error } = await supabaseServer
    .from('discos')
    .select('id, capa_url')
    .eq('deletado', false)
    .eq('ativo', true)
    .contains('generos', [id])
    .not('capa_url', 'is', null)
    .order('id', { ascending: false })
    .limit(CAPAS_POR_GENERO);
  return error ? [] : data || [];
}

export default async function GenerosPage() {
  const contagem = await contarDiscosPorGenero(GENEROS.map((g) => g.id)).catch(() => ({}));
  const generos = GENEROS.map((g) => ({ ...g, total: contagem[g.id] || 0 }))
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total);
  const capas = await Promise.all(generos.map((g) => capasDoGenero(g.id)));

  return (
    <div className="pageContainer edGenerosPagina">
      <JsonLd dados={trilha([['Início', '/'], ['Gêneros', CAMINHO]])} />
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Botao href="/" icone aria-label="Voltar para o catálogo">
            <FiArrowLeft size={19} />
          </Botao>
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Gêneros</h1>
            <p className="headerSubtitle">Vitrine do estoque</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      <main id="conteudo">
        {generos.length === 0 ? (
          <p className="edGenerosVazio">Os gêneros dos discos ainda estão sendo organizados.</p>
        ) : (
          <ul className="edGenerosLista">
            {generos.map((g, i) => (
              <li key={g.id}>
                <Link href={hrefDoGenero(g.id)} className="edGeneroItem">
                  <span className="edGeneroItemTexto">
                    <span className="edGeneroItemNome">{g.nome}</span>
                    <span className="edGeneroItemTotal tabularNums">
                      <strong>{g.total.toLocaleString('pt-BR')}</strong> {g.total === 1 ? 'disco' : 'discos'}
                    </span>
                  </span>
                  <span className="edGeneroItemCapas" aria-hidden="true">
                    {capas[i].map((c) => (
                      <img key={c.id} src={c.capa_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                    ))}
                  </span>
                  <FiChevronRight className="edGeneroItemSeta" size={20} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BarraEditorial />
    </div>
  );
}
