'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import CartDrawer from './CartDrawer';
import { getCartItemKey } from '@/utils/cartUtils';

// Mesma chave de antes: sacolas já salvas nos navegadores continuam valendo.
const CART_STORAGE_KEY = 'freelancer_vitrine_cart';

const CartContext = createContext(null);

function lerSacolaSalva() {
  try {
    const salva = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(salva) ? salva.filter((i) => i && i.id != null) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Sacola única do site: um só estado e uma só gaveta, montados no layout.
 * Antes, cada página e cada barra de navegação tinham a sua cópia (e às vezes
 * duas gavetas montadas ao mesmo tempo).
 */
export function CartProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [aberta, setAberta] = useState(false);
  // Só grava depois de ler a sacola salva; senão a primeira renderização (vazia)
  // apagaria a sacola guardada no navegador.
  const [carregada, setCarregada] = useState(false);
  const itensRef = useRef(itens);
  itensRef.current = itens;

  // Lê a sacola salva só no cliente (evita diferença de hidratação) e acompanha outras abas.
  useEffect(() => {
    setItens(lerSacolaSalva());
    setCarregada(true);
    const handleStorage = (e) => {
      if (e.key === null || e.key === CART_STORAGE_KEY) setItens(lerSacolaSalva());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!carregada) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itens));
    } catch (_) {}
  }, [itens, carregada]);

  const abrir = useCallback(() => setAberta(true), []);
  const fechar = useCallback(() => setAberta(false), []);

  // Item que já está na sacola: abre a sacola em vez de duplicar.
  const adicionar = useCallback((item) => {
    const chave = getCartItemKey(item);
    if (itensRef.current.some((i) => getCartItemKey(i) === chave)) {
      setAberta(true);
      return;
    }
    setItens((atuais) =>
      atuais.some((i) => getCartItemKey(i) === chave) ? atuais : [...atuais, item]
    );
  }, []);

  const remover = useCallback((idOuChave) => {
    setItens((atuais) =>
      atuais.filter((i) => getCartItemKey(i) !== idOuChave && i.id !== idOuChave)
    );
  }, []);

  const limpar = useCallback(() => setItens([]), []);
  const substituir = useCallback((novos) => setItens(novos), []);

  const valor = useMemo(() => {
    const chaves = new Set(itens.map((i) => getCartItemKey(i)));
    return {
      itens,
      quantidade: itens.length,
      estaNaSacola: (item) => chaves.has(getCartItemKey(item)),
      adicionar,
      remover,
      abrir,
    };
  }, [itens, adicionar, remover, abrir]);

  return (
    <CartContext.Provider value={valor}>
      {children}
      <CartDrawer
        isOpen={aberta}
        onClose={fechar}
        itens={itens}
        onRemoveItem={remover}
        onClearCart={limpar}
        onReplaceCart={substituir}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return contexto;
}
