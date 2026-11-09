'use client';

import Link from 'next/link';
import AlbumCover from '@/components/AlbumCover';
import Localizacao from '@/components/Localizacao';
import { getCartItemKey } from '@/utils/cartUtils';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { chaveCaixa } from '@/utils/caixaUtils';
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
    // Chave canônica: "1" e "Caixa 1" são a mesma caixa.
    const chave = `${item.loja || ''}|${chaveCaixa(item.caixa, item.loja || 'Loja 1')}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.chave === chave) ultimo.itens.push(item);
    else grupos.push({ chave, loja: item.loja, caixa: item.caixa, itens: [item] });
  }
  return grupos;
}

// Primeira letra do título sem acento; números e símbolos ficam juntos em "#".
function letraDoTitulo(titulo) {
  const primeira = String(titulo || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^[^a-z0-9]+/i, '')
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(primeira) ? primeira : '#';
}

// Uma divisória por letra, mesmo que algum título fora de ordem caia longe das outras.
function agruparPorLetra(itens) {
  const grupos = new Map();
  for (const item of itens) {
    const letra = letraDoTitulo(item.titulo);
    if (!grupos.has(letra)) grupos.set(letra, { letra, itens: [] });
    grupos.get(letra).itens.push(item);
  }
  return [...grupos.values()];
}

// Caixa cortada pela paginação: diz só se ela continua de outra página, sem contador.
function trechoDaCaixa(itens) {
  const primeiro = itens[0]?.posicaoNaCaixa;
  const total = itens[0]?.totalNaCaixa;
  if (!primeiro || !total || itens.length >= total) return null;
  return { continuacao: primeiro > 1 };
}

function CabecalhoCaixa({ loja, caixa, itens }) {
  const rotulo = formatCaixa(caixa, loja);
  const caminho = hrefDaCaixa(loja, caixa, { doCatalogo: true });
  const href = caminho ? ed(caminho) : null;
  const trecho = trechoDaCaixa(itens);
  return (
    <div className="edCaixaCab">
      <h2 className="edCaixaNum tabularNums">{rotulo === '—' ? 'Sem caixa' : rotulo}</h2>
      <span className="edCaixaInfo">
        {loja && (
          <span className="edCaixaLoja">
            <span className="edPonto" style={{ backgroundColor: COR_LOJA[loja] || 'var(--badge-neutral)' }} aria-hidden="true" />
            {loja}
          </span>
        )}
      </span>
      {href && (
        <Link href={href} className="edCaixaLink">
          {trecho ? 'Ver caixa inteira' : 'Ver caixa'}
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
          {selo && <span>{selo}</span>}
          {ano && (!selo || !selo.includes(ano)) && <span>{ano}</span>}
          {importado && <span>Importado</span>}
        </span>
      </div>

      {/* Onde está o disco: linha própria, na fonte dos títulos, logo acima do preço. */}
      {mostrarCaixa && rotuloCaixa !== '—' && <Localizacao caixa={item.caixa} loja={item.loja} />}

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
  // Página da caixa: divide os títulos por letra, como as divisórias do caixote.
  dividirPorLetra = false,
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

  if (dividirPorLetra) {
    const grupos = agruparPorLetra(itens);
    const idLetra = (letra) => `letra-${letra === '#' ? 'num' : letra}`;
    return (
      <>
        {/* Atalho para as letras que existem na caixa: pula direto para a divisória. */}
        {grupos.length > 1 && (
          <nav className="edLetras" aria-label="Ir para a letra">
            {grupos.map((g) => (
              <a key={g.letra} href={`#${idLetra(g.letra)}`} className="edLetraAtalho">
                {g.letra}
              </a>
            ))}
          </nav>
        )}
        <div className="edGrupos">
          {grupos.map((g) => (
            <section key={g.letra} id={idLetra(g.letra)} className="edGrupo edGrupoLetra" aria-label={`Títulos com ${g.letra}`}>
              <h2 className="edLetra">{g.letra}</h2>
              <ul className="edLista">{g.itens.map((item) => linha(item, mostrarCaixa))}</ul>
            </section>
          ))}
        </div>
      </>
    );
  }

  if (!agruparPorCaixa) {
    return <ul className="edLista">{itens.map((item) => linha(item, mostrarCaixa))}</ul>;
  }

  return (
    <div className="edGrupos">
      {agrupar(itens).map((g) => (
        <section key={g.chave} className="edGrupo">
          <CabecalhoCaixa loja={g.loja} caixa={g.caixa} itens={g.itens} />
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
