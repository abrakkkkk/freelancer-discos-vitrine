'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryTabs from '@/components/CategoryTabs';
import CatalogFilters from '@/components/CatalogFilters';
import ProductCard from '@/components/ProductCard';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import CatalogPagination from '@/components/CatalogPagination';
import BottomNav from '@/components/BottomNav';
import CartDrawer from '@/components/CartDrawer';
import { getCartItemKey } from '@/utils/cartUtils';

const CART_STORAGE_KEY = 'freelancer_vitrine_cart';

export default function CatalogoPage() {
  const [categoria, setCategoria] = useState('discos');
  const [busca, setBusca] = useState('');
  const [loja, setLoja] = useState('');
  const [caixa, setCaixa] = useState('');
  const [caixas, setCaixas] = useState([]);
  const [ordenacao, setOrdenacao] = useState('padrao');
  const [pagina, setPagina] = useState(1);

  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Inicializa sacola do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (_) {}
  };

  const handleAddToCart = (item) => {
    const itemComCategoria = { ...item, categoria: item.categoria || categoria };
    const chaveAlvo = getCartItemKey(itemComCategoria);
    const jaExiste = cart.some((i) => getCartItemKey(i) === chaveAlvo);
    if (jaExiste) {
      // Se já existe, abre a sacola
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

  // Carrega caixas disponíveis de acordo com a loja
  useEffect(() => {
    let ativo = true;
    async function loadCaixas() {
      try {
        const res = await fetch(`/api/caixas?loja=${encodeURIComponent(loja)}`);
        if (res.ok) {
          const data = await res.json();
          if (ativo && data.caixas) {
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

  // Carrega dados do catálogo
  const loadCatalogo = useCallback(async () => {
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

    try {
      const params = new URLSearchParams({
        categoria,
        pagina: String(pagina),
        loja,
        caixa,
        busca,
      });

      if (ordenarColuna) params.set('ordenarColuna', ordenarColuna);
      if (ordenarDirecao) params.set('ordenarDirecao', ordenarDirecao);

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao consultar produtos');

      const data = await res.json();
      setItens(data.itens || []);
      setTotal(data.total || 0);
      setTotalPaginas(data.totalPaginas || 1);
    } catch (err) {
      console.error(err);
      setErro('Catálogo indisponível no momento. Tente recarregar.');
    } finally {
      setLoading(false);
    }
  }, [categoria, pagina, loja, caixa, busca, ordenacao]);

  useEffect(() => {
    loadCatalogo();
  }, [loadCatalogo]);

  const handleTabChange = (novaCategoria) => {
    setCategoria(novaCategoria);
    setPagina(1);
    setCaixa('');
  };

  const handleBuscaChange = (novaBusca) => {
    setBusca(novaBusca);
    setPagina(1);
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
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #232328',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#18181c',
              border: '1px solid #2d2d35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.jpg"
              alt="Freelancer Discos"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              Freelancer Discos
            </h1>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
              Vitrine Oficial · Consulta de Estoque
            </span>
          </div>
        </div>
      </header>

      {/* Abas de Categoria */}
      <div style={{ marginBottom: '14px' }}>
        <CategoryTabs activeTab={categoria} onTabChange={handleTabChange} />
      </div>

      {/* Filtros e Busca */}
      <div style={{ marginBottom: '18px' }}>
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

      {/* Contador de Resultados */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#a1a1aa' }}>
          {loading ? 'Carregando...' : `${total} ${total === 1 ? 'item encontrado' : 'itens encontrados'}`}
        </span>
      </div>

      {/* Erro */}
      {erro && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2e1212',
            border: '1px solid #6b2121',
            borderRadius: '10px',
            color: '#fca5a5',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <p style={{ marginBottom: '8px', fontSize: '14px' }}>{erro}</p>
          <button
            type="button"
            onClick={loadCatalogo}
            style={{
              padding: '8px 16px',
              backgroundColor: '#8b1e1e',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Grade de Produtos */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                height: '280px',
                backgroundColor: '#151518',
                border: '1px solid #232328',
                borderRadius: '12px',
              }}
            />
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
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
      {!loading && (
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
