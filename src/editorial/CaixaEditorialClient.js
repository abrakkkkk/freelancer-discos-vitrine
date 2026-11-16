'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
import ProductDetailSheet from '@/components/ProductDetailSheet';
import { useCart } from '@/components/CartProvider';
import ListaEditorial, { agruparPorLetra, idLetra } from './ListaEditorial';
import { BarraEditorial } from './NavEditorial';

// Caixa anterior e próxima da mesma loja.
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

// Também serve às listas da página inicial ("Chegaram agora", "Importados"): na ordem de chegada,
// sem divisória de letra e com a caixa de cada disco.
export default function CaixaEditorialClient({
  itens = [],
  nomeLoja,
  anterior,
  proxima,
  porLetra = true,
  mostrarCaixa = false,
  ondeBusca = 'nesta caixa',
}) {
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

  const letras = useMemo(() => (porLetra ? agruparPorLetra(itens).map((g) => g.letra) : []), [itens, porLetra]);

  return (
    <div className="edCaixaPagina">
      <aside className="edCaixaLateral" aria-label={`Navegar ${ondeBusca}`}>
        {itens.length > 6 && (
          <div className="edCaixaLatBusca">
            <FiSearch size={17} color="var(--text-muted)" aria-hidden="true" className="edCaixaLatBuscaIcone" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar ${ondeBusca}`}
              aria-label={`Buscar ${ondeBusca}`}
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
                <Link href={anterior.href} className="edLatEscolha">
                  <FiChevronLeft size={16} aria-hidden="true" />
                  {anterior.rotulo}
                </Link>
              )}
              {proxima && (
                <Link href={proxima.href} className="edLatEscolha edCaixaLatProxima">
                  {proxima.rotulo}
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
              placeholder={`Buscar ${ondeBusca}`}
              aria-label={`Buscar ${ondeBusca}`}
              className="fieldInput"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca na caixa" className="inputClearBtn">
                <FiX size={16} />
              </button>
            )}
          </div>
          {busca && (
            <p className="tabularNums" style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {filtrados.length.toLocaleString('pt-BR')} de {itens.length.toLocaleString('pt-BR')} itens
            </p>
          )}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="semResultados">
          <p className="semResultadosTitulo">
            {itens.length === 0 ? (nomeLoja ? 'Esta caixa está vazia no momento' : 'Nenhum disco aqui no momento') : `Nenhum item corresponde à busca ${ondeBusca}`}
          </p>
          <p className="semResultadosDica">
            {itens.length === 0 ? (nomeLoja ? `Nenhum item cadastrado nesta caixa para ${nomeLoja}.` : '') : 'Tente limpar a busca acima.'}
          </p>
        </div>
      ) : (
        <ListaEditorial
          itens={filtrados}
          categoria="discos"
          agruparPorCaixa={false}
          dividirPorLetra={porLetra && !busca}
          mostrarCaixa={mostrarCaixa}
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
        linkCaixa={mostrarCaixa}
      />

      <BarraEditorial />
    </div>
  );
}
