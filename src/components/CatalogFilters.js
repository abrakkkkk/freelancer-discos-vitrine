'use client';

import { FiSearch, FiX } from 'react-icons/fi';

const ORDENACAO_LABELS = {
  preco_asc: 'Menor preço',
  preco_desc: 'Maior preço',
  artista_asc: 'Artista A–Z',
  titulo_asc: 'Título A–Z',
};

export default function CatalogFilters({
  busca,
  onBuscaChange,
  loja,
  onLojaChange,
  caixa,
  onCaixaChange,
  caixas = [],
  ordenacao,
  onOrdenacaoChange,
  tipo = 'discos',
}) {
  const isVideo = tipo === 'dvds' || tipo === 'vhs';

  const caixaSelecionadaObj = caixas.find((c) => String(c.caixa) === String(caixa));
  const labelCaixaAtiva = caixaSelecionadaObj ? caixaSelecionadaObj.label : `Caixa ${caixa}`;
  const temOrdenacao = Boolean(ordenacao && ordenacao !== 'padrao');

  // A busca já tem seu próprio botão de limpar dentro do campo; chips só para os seletores.
  const chipsCount = (loja ? 1 : 0) + (caixa ? 1 : 0) + (temOrdenacao ? 1 : 0);

  const handleClearAll = () => {
    onLojaChange('');
    onCaixaChange('');
    onOrdenacaoChange('padrao');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Campo de Busca */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <FiSearch
          size={18}
          color="#8a8a93"
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder={isVideo ? 'Buscar por título' : 'Buscar artista, álbum ou selo'}
          aria-label="Buscar no catálogo"
          className="fieldInput"
        />
        {busca && (
          <button
            type="button"
            onClick={() => onBuscaChange('')}
            aria-label="Limpar busca"
            className="inputClearBtn"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Seletores: Loja, Caixa, Ordenação */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '6px',
        }}
      >
        <select
          value={loja}
          onChange={(e) => {
            onLojaChange(e.target.value);
            onCaixaChange('');
          }}
          aria-label="Filtrar por loja"
          className={`fieldSelect ${loja ? 'fieldSelectActive' : ''}`}
        >
          <option value="">Lojas</option>
          <option value="Loja 1">Loja 1</option>
          <option value="Loja 2">Loja 2</option>
        </select>

        <select
          value={caixa}
          onChange={(e) => onCaixaChange(e.target.value)}
          aria-label="Filtrar por caixa"
          className={`fieldSelect tabularNums ${caixa ? 'fieldSelectActive' : ''}`}
        >
          <option value="">Caixas</option>
          {caixas.map((cx) => (
            <option key={cx.caixa} value={cx.caixa}>
              {cx.label} {cx.total > 0 ? `(${cx.total})` : ''}
            </option>
          ))}
        </select>

        <select
          value={ordenacao}
          onChange={(e) => onOrdenacaoChange(e.target.value)}
          aria-label="Ordenar itens"
          className={`fieldSelect ${temOrdenacao ? 'fieldSelectActive' : ''}`}
        >
          <option value="padrao">Ordenar</option>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
          {isVideo ? (
            <option value="titulo_asc">Título A–Z</option>
          ) : (
            <option value="artista_asc">Artista A–Z</option>
          )}
        </select>
      </div>

      {/* Filtros ativos: remoção em 1 toque */}
      {chipsCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {loja && (
            <button
              type="button"
              className="filterChip"
              aria-label={`Remover filtro ${loja}`}
              onClick={() => {
                onLojaChange('');
                onCaixaChange('');
              }}
            >
              <span>{loja}</span>
              <FiX size={13} />
            </button>
          )}

          {caixa && (
            <button
              type="button"
              className="filterChip tabularNums"
              aria-label={`Remover filtro ${labelCaixaAtiva}`}
              onClick={() => onCaixaChange('')}
            >
              <span>{labelCaixaAtiva}</span>
              <FiX size={13} />
            </button>
          )}

          {temOrdenacao && (
            <button
              type="button"
              className="filterChip"
              aria-label="Remover ordenação"
              onClick={() => onOrdenacaoChange('padrao')}
            >
              <span>{ORDENACAO_LABELS[ordenacao] || ordenacao}</span>
              <FiX size={13} />
            </button>
          )}

          {chipsCount >= 2 && (
            <button type="button" className="textBtn" onClick={handleClearAll}>
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
