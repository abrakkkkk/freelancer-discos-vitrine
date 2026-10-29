'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CategoryTabs from '@/components/CategoryTabs';
import CatalogFilters from '@/components/CatalogFilters';
import ProductCard from '@/components/ProductCard';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import CatalogPagination from '@/components/CatalogPagination';
import BottomNav from '@/components/BottomNav';
import CartDrawer from '@/components/CartDrawer';
import DesktopHeaderNav from '@/components/DesktopHeaderNav';
import { getCartItemKey } from '@/utils/cartUtils';

const CART_STORAGE_KEY = 'freelancer_vitrine_cart';
const CLIENT_CACHE_TTL_MS = 60 * 1000;

const clientCatalogCache = new Map();
const clientCaixasCache = new Map();
let savedViewState = {
  categoria: 'discos',
  busca: '',
  loja: '',
  caixa: '',
  ordenacao: 'padrao',
  pagina: 1,
};

function buildCatalogCacheKey({ categoria, pagina, loja, caixa, busca, ordenacao }) {
  return `${categoria}|${pagina}|${loja}|${caixa}|${busca}|${ordenacao}`;
}

export default function CatalogoPage() {
  const [categoria, setCategoria] = useState(savedViewState.categoria);
  const [busca, setBusca] = useState(savedViewState.busca);
  const [debouncedBusca, setDebouncedBusca] = useState(savedViewState.busca);
  const [loja, setLoja] = useState(savedViewState.loja);
  const [caixa, setCaixa] = useState(savedViewState.caixa);
  const [caixas, setCaixas] = useState(() => clientCaixasCache.get(savedViewState.loja) || []);
  const [ordenacao, setOrdenacao] = useState(savedViewState.ordenacao);
  const [pagina, setPagina] = useState(savedViewState.pagina);

  const initialCacheEntry = clientCatalogCache.get(
    buildCatalogCacheKey({
      categoria: savedViewState.categoria,
      pagina: savedViewState.pagina,
      loja: savedViewState.loja,
      caixa: savedViewState.caixa,
      busca: savedViewState.busca,
      ordenacao: savedViewState.ordenacao,
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
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persiste estado da visão para retorno instantâneo ao clicar em Catálogo
  useEffect(() => {
    savedViewState = {
      categoria,
      busca: debouncedBusca,
      loja,
      caixa,
      ordenacao,
      pagina,
    };
  }, [categoria, debouncedBusca, loja, caixa, ordenacao, pagina]);

  // A página volta para 1 só quando a busca efetiva muda (após o debounce). Antes, cada
  // tecla zerava a página na hora e disparava uma consulta extra com o termo antigo.
  const ultimaBuscaRef = useRef(savedViewState.busca);
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

  // Inicializa sacola do localStorage
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setCart(JSON.parse(stored));
        } else {
          setCart([]);
        }
      } catch (_) {}
    };
    load();
    window.addEventListener('storage', load);
    window.addEventListener('cartChange', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('cartChange', load);
    };
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartChange'));
    } catch (_) {}
  };

  const handleAddToCart = (item) => {
    const itemComCategoria = { ...item, categoria: item.categoria || categoria };
    const chaveAlvo = getCartItemKey(itemComCategoria);
    const jaExiste = cart.some((i) => getCartItemKey(i) === chaveAlvo);
    if (jaExiste) {
      setIsCartOpen(true);
      return;
    }
    saveCart([...cart, itemComCategoria]);
  };

  const handleRemoveFromCart = (idOuChave) => {
    saveCart(
      cart.filter(
        (i) => getCartItemKey(i) !== idOuChave && i.id !== idOuChave
      )
    );
  };

  const handleClearCart = () => {
    saveCart([]);
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

  const cartKeys = new Set(cart.map((i) => getCartItemKey(i)));

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

        <DesktopHeaderNav
          cartCount={cart.length}
          onOpenCart={() => setIsCartOpen(true)}
        />
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
        <div className="catalogGrid" aria-busy="true" aria-label="Carregando produtos">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="skeletonCard">
              <div className="skeletonBlock" style={{ width: '100%', aspectRatio: '1 / 1' }} />
              <div className="skeletonBlock" style={{ width: '60%', height: '12px' }} />
              <div className="skeletonBlock" style={{ width: '90%', height: '16px' }} />
              <div className="skeletonBlock" style={{ width: '45%', height: '24px', marginTop: '4px' }} />
            </div>
          ))}
        </div>
      ) : itens.length === 0 ? (
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            backgroundColor: '#151518',
            border: '1px solid #232328',
            borderRadius: '12px',
          }}
        >
          <p style={{ fontSize: '15px', color: '#e4e4e7', fontWeight: 600 }}>
            Nenhum item encontrado
          </p>
          <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
            Tente buscar com outros termos ou limpar os filtros de loja e caixa.
          </p>
        </div>
      ) : (
        <div className="catalogGrid">
          {itens.map((item) => {
            const itemKey = getCartItemKey({ ...item, categoria });
            return (
              <ProductCard
                key={itemKey}
                item={item}
                tipo={categoria}
                isInCart={cartKeys.has(itemKey)}
                onAddToCart={handleAddToCart}
                onOpenDetail={(i) => setDetailItem({ ...i, categoria })}
              />
            );
          })}
        </div>
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
            ? cartKeys.has(
                getCartItemKey({
                  ...detailItem,
                  categoria: detailItem.categoria || categoria,
                })
              )
            : false
        }
        onAddToCart={handleAddToCart}
        tipo={detailItem?.categoria || categoria}
      />

      {/* Drawer da Sacola */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        itens={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onReplaceCart={saveCart}
      />

      {/* Barra de Navegação Móvel Inferior */}
      <BottomNav
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
