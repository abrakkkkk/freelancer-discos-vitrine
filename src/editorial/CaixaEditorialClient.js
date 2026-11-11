'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import { useCart } from '@/components/CartProvider';
import ListaEditorial, { agruparPorLetra, idLetra } from './ListaEditorial';
import { BarraEditorial } from './NavEditorial';

// Itens de uma caixa no estilo editorial, com busca dentro da caixa.
// Caixa anterior e próxima da mesma loja, como folhear os caixotes.
function VizinhasCaixa({ anterior, proxima }) {
  if (!anterior && !proxima) return null;
  return (
    <nav className="edVizinhas" aria-label="Outras caixas">
      {anterior ? (
        <Link href={anterior.href} className="edVizinha">
          <FiChevronLeft size={18} aria-hidden="true" />
          {anterior.rotulo}
        </Link>
      ) : <span />}
      {proxima && (
        <Link href={proxima.href} className="edVizinha edVizinhaProxima">
          {proxima.rotulo}
          <FiChevronRight size={18} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

export default function CaixaEditorialClient({ itens = [], rotuloCaixa, nomeLoja, anterior, proxima }) {
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

  // Letras presentes na caixa, para a coluna do computador.
  const letras = useMemo(() => agruparPorLetra(itens).map((g) => g.letra), [itens]);

  return (
    <div className="edCaixaPagina">
      {/* Computador: busca, índice de letras e caixas vizinhas fixos à esquerda.
          Escondida no celular, que usa a faixa de letras e os botões de sempre. */}
      <aside className="edCaixaLateral" aria-label={`Navegar na ${rotuloCaixa}`}>
        {itens.length > 6 && (
          <div className="edCaixaLatBusca">
            <FiSearch size={17} color="var(--text-muted)" aria-hidden="true" className="edCaixaLatBuscaIcone" />
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
        )}
        {busca && (
          <p className="tabularNums edCaixaLatContagem">
            {filtrados.length.toLocaleString('pt-BR')} de {itens.length.toLocaleString('pt-BR')} itens
          </p>
        )}
        {!busca && letras.length > 1 && (
          <section>
            <h2 className="edLatTitulo">Ir para a letra</h2>
            <nav className="edCaixaLatLetras" aria-label="Ir para a letra">
              {letras.map((l) => (
                <a key={l} href={`#${idLetra(l)}`} className="edCaixaLatLetra">
                  {l}
                </a>
              ))}
            </nav>
          </section>
        )}
        {(anterior || proxima) && (
          <section>
            <h2 className="edLatTitulo">Outras caixas</h2>
            <div className="edCaixaLatVizinhas">
              {anterior && (
                <Link href={anterior.href} className="edLatOpcao">
                  <span className="edLatOpcaoNome">
                    <FiChevronLeft size={16} aria-hidden="true" />
                    {anterior.rotulo}
                  </span>
                </Link>
              )}
              {proxima && (
                <Link href={proxima.href} className="edLatOpcao">
                  <span className="edLatOpcaoNome">{proxima.rotulo}</span>
                  <FiChevronRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </section>
        )}
      </aside>

      <div className="edCaixaPrincipal">
      <VizinhasCaixa anterior={anterior} proxima={proxima} />
      {itens.length > 6 && (
        <div className="edCaixaBuscaCelular" style={{ marginBottom: '14px' }}>
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
            <p className="tabularNums" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
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
          dividirPorLetra={!busca}
          mostrarCaixa={false}
          estaNaSacola={estaNaSacola}
          onAdicionar={handleAdd}
          onAbrir={(i) => setDetailItem(i)}
        />
      )}

      <VizinhasCaixa anterior={anterior} proxima={proxima} />
      </div>

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
    </div>
  );
}
