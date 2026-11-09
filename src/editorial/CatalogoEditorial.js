'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryTabs, { CATEGORIES } from '@/components/CategoryTabs';
import CatalogFilters from '@/components/CatalogFilters';
import ListaEditorial, { ListaCarregando } from './ListaEditorial';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import CatalogPagination from '@/components/CatalogPagination';
import { BarraEditorial, NavDesktopEditorial } from './NavEditorial';
import { useCart } from '@/components/CartProvider';
import { getCartItemKey } from '@/utils/cartUtils';
import { ESTADO_PADRAO, lerEstadoDaUrl, montarQueryDoEstado } from '@/utils/catalogUrl';

const CLIENT_CACHE_TTL_MS = 60 * 1000;

const clientCatalogCache = new Map();
const clientCaixasCache = new Map();
// Último estado da sessão: ao voltar para "/" sem filtros na URL, restaura a busca anterior.
let savedViewState = { ...ESTADO_PADRAO };

function buildCatalogCacheKey({ categoria, pagina, loja, caixa, busca, ordenacao }) {
  return `${categoria}|${pagina}|${loja}|${caixa}|${busca}|${ordenacao}`;
}

// useSearchParams exige um Suspense: no build a página é estática e a URL só existe no navegador.
// Catálogo no estilo editorial (lista agrupada por caixa).
export default function CatalogoEditorialPage() {
  return (
    <Suspense fallback={<CatalogoCarregando />}>
      <Catalogo />
    </Suspense>
  );
}

function OutrosFormatos({ formatos, onEscolher }) {
  if (!formatos.length) return null;
  return (
    <div className="outrosFormatos">
      <span>Também tem em</span>
      {formatos.map((f) => (
        <button key={f.id} type="button" className="filterChip tabularNums" onClick={() => onEscolher(f.id)}>
          <span>
            {f.label} ({f.total.toLocaleString('pt-BR')})
          </span>
        </button>
      ))}
    </div>
  );
}

function SemResultados({
  busca,
  formato,
  temFiltros,
  outrosFormatos,
  onLimparBusca,
  onLimparFiltros,
  onEscolherFormato,
}) {
  const titulo = busca
    ? `Nada encontrado para “${busca}” em ${formato}`
    : temFiltros
      ? `Nenhum item em ${formato} com estes filtros`
      : `Nenhum item em ${formato} no momento`;
  const dica = outrosFormatos.length
    ? 'Essa busca tem resultados em outro formato.'
    : busca && temFiltros
      ? 'Confira a grafia ou tire os filtros de loja e caixa.'
      : busca
        ? 'Confira a grafia ou busque só pelo nome do artista.'
        : temFiltros
          ? 'Tire os filtros de loja e caixa para ver mais itens.'
          : 'Veja os outros formatos nas abas acima.';

  return (
    <div className="semResultados">
      <p className="semResultadosTitulo">{titulo}</p>
      <p className="semResultadosDica">{dica}</p>

      <OutrosFormatos formatos={outrosFormatos} onEscolher={onEscolherFormato} />

      {(busca || temFiltros) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {busca && (
            <button type="button" className="textBtn" onClick={onLimparBusca}>
              Limpar busca
            </button>
          )}
          {temFiltros && (
            <button type="button" className="textBtn" onClick={onLimparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogoCarregando() {
  return (
    <div className="pageContainer">
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.jpg" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Freelancer Discos</h1>
            <p className="headerSubtitle">Vitrine do estoque</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>
      <ListaCarregando />
      <BarraEditorial />
    </div>
  );
}

function Catalogo() {
  const searchParams = useSearchParams();
  // Filtros da URL têm prioridade (link compartilhado, F5); sem eles, volta ao último estado.
  const [estadoInicial] = useState(() => lerEstadoDaUrl(searchParams) || savedViewState);

  const [categoria, setCategoria] = useState(estadoInicial.categoria);
  const [busca, setBusca] = useState(estadoInicial.busca);
  const [debouncedBusca, setDebouncedBusca] = useState(estadoInicial.busca);
  const [loja, setLoja] = useState(estadoInicial.loja);
  const [caixa, setCaixa] = useState(estadoInicial.caixa);
  const [caixas, setCaixas] = useState(() => clientCaixasCache.get(estadoInicial.loja) || []);
  const [ordenacao, setOrdenacao] = useState(estadoInicial.ordenacao);
  const [pagina, setPagina] = useState(estadoInicial.pagina);

  const initialCacheEntry = clientCatalogCache.get(
    buildCatalogCacheKey({
      categoria: estadoInicial.categoria,
      pagina: estadoInicial.pagina,
      loja: estadoInicial.loja,
      caixa: estadoInicial.caixa,
      busca: estadoInicial.busca,
      ordenacao: estadoInicial.ordenacao,
    })
  );
  const hasValidInitialCache =
    Boolean(initialCacheEntry) && initialCacheEntry.expiresAt > Date.now();

  const [itens, setItens] = useState(() =>
    hasValidInitialCache ? initialCacheEntry.itens : []
  );
  const [total, setTotal] = useState(() =>
    hasValidInitialCache ? initialCacheEntry.total : 0
  );
  const [totalPaginas, setTotalPaginas] = useState(() =>
    hasValidInitialCache ? initialCacheEntry.totalPaginas : 1
  );
  const [loading, setLoading] = useState(() => !hasValidInitialCache);
  const [erro, setErro] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const { estaNaSacola, adicionar: adicionarNaSacola } = useCart();

  // Persiste o estado (retorno instantâneo ao clicar em Catálogo) e o espelha na URL.
  // replaceState: trocar filtro não cria uma entrada nova no "voltar" do navegador.
  useEffect(() => {
    savedViewState = {
      categoria,
      busca: debouncedBusca,
      loja,
      caixa,
      ordenacao,
      pagina,
    };
    const query = montarQueryDoEstado(savedViewState);
    const atual = window.location.search.replace(/^\?/, '');
    if (query !== atual) {
      const url = query ? `?${query}` : window.location.pathname;
      window.history.replaceState(window.history.state, '', url);
    }
  }, [categoria, debouncedBusca, loja, caixa, ordenacao, pagina]);

  // A página volta para 1 só quando a busca efetiva muda (após o debounce). Antes, cada
  // tecla zerava a página na hora e disparava uma consulta extra com o termo antigo.
  const ultimaBuscaRef = useRef(estadoInicial.busca);
  useEffect(() => {
    const aplicar = () => {
      if (busca === ultimaBuscaRef.current) return;
      ultimaBuscaRef.current = busca;
      setDebouncedBusca(busca);
      setPagina(1);
    };
    if (!busca) {
      aplicar();
      return;
    }
    const timer = setTimeout(aplicar, 280);
    return () => clearTimeout(timer);
  }, [busca]);

  const handleAddToCart = (item) => {
    adicionarNaSacola({ ...item, categoria: item.categoria || categoria });
  };

  // Carrega caixas disponíveis de acordo com a loja (com cache em memória)
  useEffect(() => {
    const cachedCaixas = clientCaixasCache.get(loja);
    if (cachedCaixas) {
      setCaixas(cachedCaixas);
      return;
    }

    let ativo = true;
    async function loadCaixas() {
      try {
        const res = await fetch(`/api/caixas?loja=${encodeURIComponent(loja)}`);
        if (res.ok) {
          const data = await res.json();
          if (ativo && data.caixas) {
            clientCaixasCache.set(loja, data.caixas);
            setCaixas(data.caixas);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar caixas:', err);
      }
    }
    loadCaixas();
    return () => {
      ativo = false;
    };
  }, [loja]);

  // Consulta em andamento: uma nova consulta cancela a anterior, para que uma resposta
  // atrasada (ex.: termo de busca antigo) não sobrescreva o resultado mais recente.
  const consultaRef = useRef(null);
  useEffect(() => () => consultaRef.current?.abort(), []);

  // Carrega dados do catálogo (instantâneo se já estiver em cache)
  const loadCatalogo = useCallback(
    async (forceRefresh = false) => {
      consultaRef.current?.abort();
      consultaRef.current = null;

      const cacheKey = buildCatalogCacheKey({
        categoria,
        pagina,
        loja,
        caixa,
        busca: debouncedBusca,
        ordenacao,
      });

      if (!forceRefresh) {
        const cached = clientCatalogCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          setItens(cached.itens);
          setTotal(cached.total);
          setTotalPaginas(cached.totalPaginas);
          setLoading(false);
          setErro(null);
          return;
        }
      }

      setLoading(true);
      setErro(null);

      let ordenarColuna = null;
      let ordenarDirecao = null;

      if (ordenacao === 'preco_asc') {
        ordenarColuna = 'preco';
        ordenarDirecao = 'asc';
      } else if (ordenacao === 'preco_desc') {
        ordenarColuna = 'preco';
        ordenarDirecao = 'desc';
      } else if (ordenacao === 'artista_asc') {
        ordenarColuna = 'artista';
        ordenarDirecao = 'asc';
      } else if (ordenacao === 'titulo_asc') {
        ordenarColuna = 'titulo';
        ordenarDirecao = 'asc';
      }

      const controller = new AbortController();
      consultaRef.current = controller;

      try {
        const params = new URLSearchParams({
          categoria,
          pagina: String(pagina),
          loja,
          caixa,
          busca: debouncedBusca,
        });

        if (ordenarColuna) params.set('ordenarColuna', ordenarColuna);
        if (ordenarDirecao) params.set('ordenarDirecao', ordenarDirecao);

        const res = await fetch(`/api/catalogo?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Falha ao consultar produtos');

        const data = await res.json();
        if (controller.signal.aborted) return;
        const nextItens = data.itens || [];
        const nextTotal = data.total || 0;
        const nextTotalPaginas = data.totalPaginas || 1;

        clientCatalogCache.set(cacheKey, {
          itens: nextItens,
          total: nextTotal,
          totalPaginas: nextTotalPaginas,
          expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
        });

        setItens(nextItens);
        setTotal(nextTotal);
        setTotalPaginas(nextTotalPaginas);
      } catch (err) {
        // Cancelada por uma consulta mais nova: quem assume o estado é a nova.
        if (controller.signal.aborted) return;
        console.error(err);
        setErro('Catálogo indisponível no momento. Tente de novo.');
      } finally {
        if (consultaRef.current === controller) {
          consultaRef.current = null;
          setLoading(false);
        }
      }
    },
    [categoria, pagina, loja, caixa, debouncedBusca, ordenacao]
  );

  useEffect(() => {
    loadCatalogo(false);
  }, [loadCatalogo]);

  // Com busca, conta quantos resultados a mesma busca tem nos outros formatos: a busca só
  // olha a aba aberta, e quem procura "caetano" em Discos não sabe que há CDs dele.
  const [outrosFormatos, setOutrosFormatos] = useState([]);
  useEffect(() => {
    setOutrosFormatos([]);
    if (!debouncedBusca) return;

    const controller = new AbortController();
    const outras = CATEGORIES.filter((c) => c.id !== categoria);
    Promise.all(
      outras.map(async (c) => {
        const params = new URLSearchParams({ categoria: c.id, pagina: '1', loja, busca: debouncedBusca });
        const res = await fetch(`/api/catalogo?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) return null;
        const data = await res.json();
        return data.total > 0 ? { id: c.id, label: c.label, total: data.total } : null;
      })
    )
      .then((lista) => {
        if (!controller.signal.aborted) setOutrosFormatos(lista.filter(Boolean));
      })
      // Contagem é um extra: se falhar, a busca principal segue normal.
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedBusca, categoria, loja]);

  const handleTabChange = (novaCategoria) => {
    setCategoria(novaCategoria);
    setPagina(1);
    setCaixa('');
  };

  const handleBuscaChange = (novaBusca) => {
    setBusca(novaBusca);
  };

  const handleLojaChange = (novaLoja) => {
    setLoja(novaLoja);
    setPagina(1);
  };

  const handleCaixaChange = (novaCaixa) => {
    setCaixa(novaCaixa);
    setPagina(1);
  };

  const handleOrdenacaoChange = (novaOrdenacao) => {
    setOrdenacao(novaOrdenacao);
    setPagina(1);
  };

  return (
    <div className="pageContainer">
      {/* Cabeçalho */}
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.jpg" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Freelancer Discos</h1>
            <p className="headerSubtitle">Vitrine do estoque</p>
          </div>
        </div>

        <NavDesktopEditorial />
      </header>

      {/* Abas de Categoria */}
      <div style={{ marginBottom: '12px' }}>
        <CategoryTabs activeTab={categoria} onTabChange={handleTabChange} />
      </div>

      {/* Filtros e Busca */}
      <div style={{ marginBottom: '14px' }}>
        <CatalogFilters
          busca={busca}
          onBuscaChange={handleBuscaChange}
          loja={loja}
          onLojaChange={handleLojaChange}
          caixa={caixa}
          onCaixaChange={handleCaixaChange}
          caixas={caixas}
          ordenacao={ordenacao}
          onOrdenacaoChange={handleOrdenacaoChange}
          tipo={categoria}
        />
      </div>

      {/* Contagem de resultados (linha de texto simples) */}
      <p
        className="tabularNums"
        aria-live="polite"
        style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '10px', padding: '0 2px' }}
      >
        {loading ? (
          'Carregando…'
        ) : erro ? null : (
          <>
            <strong style={{ color: '#ffffff', fontWeight: 600 }}>
              {total.toLocaleString('pt-BR')}
            </strong>{' '}
            {total === 1 ? 'item' : 'itens'}
            {totalPaginas > 1 && ` · página ${pagina} de ${totalPaginas.toLocaleString('pt-BR')}`}
          </>
        )}
      </p>

      {!loading && !erro && itens.length > 0 && (
        <OutrosFormatos formatos={outrosFormatos} onEscolher={handleTabChange} />
      )}

      {/* Erro */}
      {erro && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#151518',
            border: '1px solid #232328',
            borderRadius: '12px',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <p style={{ marginBottom: '8px', fontSize: '14px' }}>{erro}</p>
          <button
            type="button"
            onClick={() => loadCatalogo(true)}
            style={{
              minHeight: '44px',
              padding: '0 18px',
              backgroundColor: '#8b1e1e',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Grade de Produtos (com erro, só o aviso acima: nada de "Nenhum item encontrado") */}
      {erro && !loading ? null : loading ? (
        <ListaCarregando />
      ) : itens.length === 0 ? (
        <SemResultados
          busca={debouncedBusca}
          formato={CATEGORIES.find((c) => c.id === categoria)?.label || 'Discos'}
          temFiltros={Boolean(loja || caixa)}
          outrosFormatos={outrosFormatos}
          onLimparBusca={() => handleBuscaChange('')}
          onLimparFiltros={() => {
            handleLojaChange('');
            handleCaixaChange('');
          }}
          onEscolherFormato={handleTabChange}
        />
      ) : (
        <ListaEditorial
          itens={itens}
          categoria={categoria}
          // Só a ordem padrão segue as caixas; com busca ou outra ordem, a caixa vai em cada linha.
          agruparPorCaixa={!debouncedBusca && ordenacao === 'padrao' && categoria === 'discos'}
          estaNaSacola={(item) => estaNaSacola({ ...item, categoria })}
          onAdicionar={handleAddToCart}
          onAbrir={(i) => setDetailItem({ ...i, categoria })}
        />
      )}

      {/* Paginação */}
      {!loading && !erro && (
        <CatalogPagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          onPageChange={(p) => setPagina(p)}
        />
      )}

      {/* Bottom Sheet com Detalhes */}
      <ProductDetailSheet
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        isInCart={
          detailItem
            ? estaNaSacola({ ...detailItem, categoria: detailItem.categoria || categoria })
            : false
        }
        onAddToCart={handleAddToCart}
        tipo={detailItem?.categoria || categoria}
      />

      {/* Barra de Navegação Móvel Inferior */}
      <BarraEditorial />
    </div>
  );
}
