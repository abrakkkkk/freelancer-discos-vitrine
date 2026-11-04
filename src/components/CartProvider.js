'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
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

  // Confirmação curta de "adicionado": some sozinha depois de alguns segundos.
  const [aviso, setAviso] = useState(null);
  const timerAviso = useRef(null);
  useEffect(() => () => clearTimeout(timerAviso.current), []);

  // Item que já está na sacola: abre a sacola em vez de duplicar.
  const adicionar = useCallback((item) => {
    const chave = getCartItemKey(item);
    if (itensRef.current.some((i) => getCartItemKey(i) === chave)) {
      setAviso(null);
      setAberta(true);
      return;
    }
    setItens((atuais) =>
      atuais.some((i) => getCartItemKey(i) === chave) ? atuais : [...atuais, item]
    );
    setAviso({ titulo: item.titulo, id: Date.now() });
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  const abrirPeloAviso = useCallback(() => {
    clearTimeout(timerAviso.current);
    setAviso(null);
    setAberta(true);
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
      <div className="sacolaAvisoArea" role="status" aria-live="polite">
        {aviso && !aberta && (
          <div key={aviso.id} className="sacolaAviso">
            <FiCheck size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span className="sacolaAvisoTexto">
              <strong>Adicionado à sacola</strong>
              <span>{aviso.titulo}</span>
            </span>
            <button type="button" className="sacolaAvisoBtn tabularNums" onClick={abrirPeloAviso}>
              Ver sacola ({itens.length})
            </button>
          </div>
        )}
      </div>
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
