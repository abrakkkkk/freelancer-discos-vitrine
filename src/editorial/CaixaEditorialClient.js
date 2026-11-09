'use client';

import { useMemo, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import { useCart } from '@/components/CartProvider';
import ListaEditorial from './ListaEditorial';
import { BarraEditorial } from './NavEditorial';

// Itens de uma caixa no estilo editorial, com busca dentro da caixa.
export default function CaixaEditorialClient({ itens = [], rotuloCaixa, nomeLoja }) {
  const [detailItem, setDetailItem] = useState(null);
  const [busca, setBusca] = useState('');
  const { estaNaSacola, adicionar } = useCart();

  const handleAdd = (item) => adicionar({ ...item, categoria: item.categoria || 'discos' });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((i) =>
      `${i.artista || ''} ${i.titulo || ''} ${i.observacao || ''} ${i.ano || ''}`.toLowerCase().includes(termo)
    );
  }, [itens, busca]);

  return (
    <>
      {itens.length > 6 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiSearch size={18} color="#8a8a93" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nesta caixa"
              aria-label={`Buscar dentro da ${rotuloCaixa}`}
              className="fieldInput"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca na caixa" className="inputClearBtn">
                <FiX size={16} />
              </button>
            )}
          </div>
          {busca && (
            <p className="tabularNums" style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '8px' }}>
              {filtrados.length.toLocaleString('pt-BR')} de {itens.length.toLocaleString('pt-BR')} itens
            </p>
          )}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="semResultados">
          <p className="semResultadosTitulo">
            {itens.length === 0 ? 'Esta caixa está vazia no momento' : 'Nenhum item corresponde à busca nesta caixa'}
          </p>
          <p className="semResultadosDica">
            {itens.length === 0 ? `Nenhum item cadastrado nesta caixa para ${nomeLoja}.` : 'Tente limpar a busca acima.'}
          </p>
        </div>
      ) : (
        <ListaEditorial
          itens={filtrados}
          categoria="discos"
          agruparPorCaixa={false}
          mostrarCaixa={false}
          estaNaSacola={estaNaSacola}
          onAdicionar={handleAdd}
          onAbrir={(i) => setDetailItem(i)}
        />
      )}

      <ProductDetailSheet
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        isInCart={detailItem ? estaNaSacola(detailItem) : false}
        onAddToCart={handleAdd}
        tipo={detailItem?.categoria || 'discos'}
        linkCaixa={false}
      />

      <BarraEditorial />
    </>
  );
}
