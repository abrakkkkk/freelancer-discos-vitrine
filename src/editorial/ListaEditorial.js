'use client';

import Link from 'next/link';
import AlbumCover from '@/components/AlbumCover';
import { getCartItemKey } from '@/utils/cartUtils';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { FiCheck, FiPlus } from 'react-icons/fi';
import { ed } from './rotas';

const COR_LOJA = { 'Loja 1': 'var(--loja-1)', 'Loja 2': 'var(--loja-2)' };

function precoBRL(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Itens seguidos da mesma loja e caixa formam um grupo, como uma página do catálogo.
function agrupar(itens) {
  const grupos = [];
  for (const item of itens) {
    const chave = `${item.loja || ''}|${item.caixa || ''}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.chave === chave) ultimo.itens.push(item);
    else grupos.push({ chave, loja: item.loja, caixa: item.caixa, itens: [item] });
  }
  return grupos;
}

function CabecalhoCaixa({ loja, caixa }) {
  const rotulo = formatCaixa(caixa, loja);
  const caminho = hrefDaCaixa(loja, caixa, { doCatalogo: true });
  const href = caminho ? ed(caminho) : null;
  return (
    <div className="edCaixaCab">
      <h2 className="edCaixaNum tabularNums">{rotulo === '—' ? 'Sem caixa' : rotulo}</h2>
      {loja && (
        <span className="edCaixaLoja">
          <span className="edPonto" style={{ backgroundColor: COR_LOJA[loja] || 'var(--badge-neutral)' }} aria-hidden="true" />
          {loja}
        </span>
      )}
      {href && (
        <Link href={href} className="edCaixaLink">
          Ver caixa
        </Link>
      )}
    </div>
  );
}

function Linha({ item, categoria, mostrarCaixa, naSacola, onAdicionar, onAbrir }) {
  const selo = extractRecordLabel(item.observacao);
  const ano = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const importado = Boolean(item.observacao && /importado/i.test(item.observacao));
  const rotuloCaixa = formatCaixa(item.caixa, item.loja);

  // Toque em qualquer parte da linha abre o detalhe; botões e links seguem o próprio clique.
  const abrirPelaLinha = (e) => {
    if (e.target.closest('a, button')) return;
    if (window.getSelection()?.toString()) return;
    onAbrir(item);
  };

  return (
    <li className="edLinha" onClick={abrirPelaLinha}>
      <AlbumCover
        id={item.id}
        artista={item.artista}
        titulo={item.titulo}
        ano={item.ano}
        capaUrl={item.capa_url}
        fluid
        tipo={categoria}
      />

      <div className="edTexto">
        {item.artista && <span className="edArtista">{item.artista}</span>}
        <button
          type="button"
          className="edTitulo"
          onClick={() => onAbrir(item)}
          aria-label={`Ver detalhes de ${item.artista ? `${item.artista} - ` : ''}${item.titulo}`}
        >
          {item.titulo}
        </button>
        <span className="edMeta tabularNums">
          {mostrarCaixa && rotuloCaixa !== '—' && (
            <span className="edMetaCaixa">
              <span className="edPonto" style={{ backgroundColor: COR_LOJA[item.loja] || 'var(--badge-neutral)' }} aria-hidden="true" />
              {rotuloCaixa}
              {item.loja ? `, ${item.loja}` : ''}
            </span>
          )}
          {selo && <span>{selo}</span>}
          {ano && (!selo || !selo.includes(ano)) && <span>{ano}</span>}
          {importado && <span>Importado</span>}
        </span>
      </div>

      <div className="edAcao">
        <span className="edPreco tabularNums">{precoBRL(item.preco)}</span>
        <button
          type="button"
          className={`edAdicionar ${naSacola ? 'edAdicionarNaSacola' : ''}`}
          onClick={() => onAdicionar(item)}
          aria-label={naSacola ? 'Item já na sacola — abrir sacola' : `Adicionar ${item.titulo} à sacola`}
        >
          {naSacola ? <FiCheck size={18} strokeWidth={2.5} /> : <FiPlus size={18} strokeWidth={2.5} />}
        </button>
      </div>
    </li>
  );
}

export default function ListaEditorial({
  itens,
  categoria,
  agruparPorCaixa,
  // Na página de uma caixa, todos os itens são dela: a caixa não se repete no card.
  mostrarCaixa = true,
  estaNaSacola,
  onAdicionar,
  onAbrir,
}) {
  const linha = (item, comCaixa) => (
    <Linha
      key={getCartItemKey({ ...item, categoria: item.categoria || categoria })}
      item={item}
      categoria={item.categoria || categoria}
      mostrarCaixa={comCaixa}
      naSacola={estaNaSacola(item)}
      onAdicionar={onAdicionar}
      onAbrir={onAbrir}
    />
  );

  if (!agruparPorCaixa) {
    return <ul className="edLista">{itens.map((item) => linha(item, mostrarCaixa))}</ul>;
  }

  return (
    <div className="edGrupos">
      {agrupar(itens).map((g) => (
        <section key={g.chave} className="edGrupo">
          <CabecalhoCaixa loja={g.loja} caixa={g.caixa} />
          <ul className="edLista">{g.itens.map((item) => linha(item, false))}</ul>
        </section>
      ))}
    </div>
  );
}

export function ListaCarregando() {
  return (
    <ul className="edLista" aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: 8 }).map((_, idx) => (
        <li key={idx} className="edLinha" style={{ cursor: 'default' }}>
          <div className="skeletonBlock" style={{ width: '100%', aspectRatio: '1 / 1' }} />
          <div className="edTexto" style={{ gap: '6px' }}>
            <div className="skeletonBlock" style={{ width: '55%', height: '12px' }} />
            <div className="skeletonBlock" style={{ width: '85%', height: '15px' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
