'use client';

import { useEffect, useRef, useState } from 'react';
import Botao from './Botao';
import ListaFaixas from './ListaFaixas';
import Link from 'next/link';
import AlbumCover from './AlbumCover';
import Localizacao from './Localizacao';
import { LinhaFichaGenero } from './SobreGenero';
import { generosDoItem } from '@/utils/generos';
import { condicoesDoItem } from '@/utils/condicoes';
import { useModalDialog } from '@/hooks/useModalDialog';
import { formatCaixa, extractRecordLabel } from '@/utils/stringUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { FiX, FiShoppingBag, FiCheck, FiChevronRight } from 'react-icons/fi';

const FORMAT_NAMES = {
  discos: 'Vinil (LP)',
  cds: 'CD',
  dvds: 'DVD',
  vhs: 'VHS',
};

export default function ProductDetailSheet({
  item,
  isOpen,
  onClose,
  onAddToCart,
  isInCart = false,
  tipo = 'discos',
  // Na página da própria caixa, o bloco de localização não leva a lugar nenhum.
  linkCaixa = true,
  // Prefixo dos links internos.
  basePath = '',
  // Troca o filtro do catálogo por trás; sem ele, o gênero vira link para o catálogo.
  onGenero,
}) {
  const dialogRef = useRef(null);
  const fecharENavegar = useModalDialog(isOpen && Boolean(item), onClose, dialogRef);

  // As faixas chegam depois da folha aberta; guardadas com o id para não mostrar as do disco anterior.
  const [faixas, setFaixas] = useState(null);
  const buscarFaixas = isOpen && Boolean(item) && tipo === 'discos';
  useEffect(() => {
    if (!buscarFaixas) return;
    const controle = new AbortController();
    fetch(`/api/faixas?id=${item.id}`, { signal: controle.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => dados?.faixas?.length && setFaixas({ id: item.id, ...dados }))
      .catch(() => {});
    return () => controle.abort();
  }, [buscarFaixas, item?.id]);

  if (!isOpen || !item) return null;
  const faixasDoItem = faixas?.id === item.id ? faixas : null;

  const precoFormatado = Number(item.preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const rotuloCaixa = formatCaixa(item.caixa, item.loja);
  const generos = tipo === 'discos' ? generosDoItem(item) : [];
  const condicoes = condicoesDoItem(item);
  const recordLabel = extractRecordLabel(item.observacao);
  const cleanAno = item.ano && String(item.ano) !== 'null' ? String(item.ano).trim() : '';
  const showAno = Boolean(cleanAno) && (!recordLabel || !recordLabel.includes(cleanAno));
  const observacaoLimpa = item.observacao
    ? String(item.observacao).replace(/\[[^\]]+\]/g, '').trim()
    : '';

  const caminhoCaixa = linkCaixa ? hrefDaCaixa(item.loja, item.caixa, { doCatalogo: true }) : null;
  const caixaHref = caminhoCaixa ? `${basePath}${caminhoCaixa}` : null;
  const temCaixa = rotuloCaixa !== '—';
  const localConteudo = (
    <>
      <span style={{ display: 'flex', minWidth: 0, flex: 1 }}>
        <Localizacao caixa={item.caixa} loja={item.loja} tamanho="detalhe" />
      </span>
      {caixaHref && <FiChevronRight size={20} color="var(--text-muted)" aria-hidden="true" />}
    </>
  );

  return (
    <div className="productDetailBackdrop">
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 1 }}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${item.titulo}`}
        className="productDetailDialog"
      >
        <Botao icone onClick={onClose} aria-label="Fechar detalhes" className="sheetFechar">
          <FiX size={19} />
        </Botao>

        <div className="sheetCapa">
          <AlbumCover
            id={item.id}
            artista={item.artista}
            titulo={item.titulo}
            ano={item.ano}
            capaUrl={item.capa_url}
            fluid
            tipo={tipo}
          />
        </div>

        <div style={{ marginTop: '14px' }}>
          <div style={{ minWidth: 0 }}>
            {item.artista && (
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                }}
              >
                {item.artista}
              </p>
            )}
            <h2
              style={{
                fontSize: '21px',
                fontWeight: 700,
                color: 'var(--text-strong)',
                lineHeight: 1.2,
                marginTop: '2px',
                overflowWrap: 'anywhere',
              }}
            >
              {item.titulo}
            </h2>
            <p
              className="tabularNums"
              style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-strong)', marginTop: '8px' }}
            >
              {precoFormatado}
            </p>
          </div>
        </div>

        {caixaHref ? (
          <Link
            href={caixaHref}
            className="sheetLocal tabularNums"
            aria-label={`${temCaixa ? rotuloCaixa : 'Caixa'}, ${item.loja}. Ver tudo desta caixa`}
            onClick={(e) => {
              // Ctrl/Cmd+clique (nova aba) segue o comportamento normal do link.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              fecharENavegar(caixaHref);
            }}
          >
            {localConteudo}
          </Link>
        ) : (
          <p className="sheetLocal tabularNums">{localConteudo}</p>
        )}

        <dl className="specList tabularNums">
          <div className="specRow">
            <dt>Formato</dt>
            <dd>{FORMAT_NAMES[tipo] || 'Disco'}</dd>
          </div>
          <LinhaFichaGenero generos={generos} onGenero={onGenero} />
          {condicoes.length > 0 && (
            <div className="specRow">
              <dt>Condição</dt>
              <dd>{condicoes.join(', ')}</dd>
            </div>
          )}
          {recordLabel && (
            <div className="specRow">
              <dt>Selo</dt>
              <dd>{recordLabel}</dd>
            </div>
          )}
          {showAno && (
            <div className="specRow">
              <dt>Ano</dt>
              <dd>{cleanAno}</dd>
            </div>
          )}
          {observacaoLimpa && (
            <div className="specRow">
              <dt>Obs.</dt>
              <dd style={{ fontWeight: 500, whiteSpace: 'pre-line' }}>{observacaoLimpa}</dd>
            </div>
          )}
        </dl>

        {faixasDoItem && (
          <ListaFaixas faixas={faixasDoItem.faixas} fonte={faixasDoItem.fonte} className="sheetFaixas" />
        )}

        {/* Botão preso no fim da folha porque a ficha pode precisar rolar. */}
        <div className="sheetAcao">
        <Botao
          variante="primario"
          tamanho="g"
          bloco
          className={isInCart ? 'botao--feito' : ''}
          prefixo={isInCart ? <FiCheck size={18} aria-hidden="true" /> : <FiShoppingBag size={18} aria-hidden="true" />}
          onClick={() => {
            if (onAddToCart) onAddToCart(item);
          }}
        >
          {isInCart ? 'Na sacola — abrir sacola' : 'Adicionar à sacola'}
        </Botao>
        </div>
      </div>
    </div>
  );
}
