'use client';

import { FiSearch, FiX } from 'react-icons/fi';

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: '#151518',
        border: '1px solid #232328',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      {/* Campo de Busca */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <FiSearch
          size={18}
          color="#71717a"
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder={isVideo ? 'Buscar por título...' : 'Buscar por artista, álbum ou caixa...'}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '0 40px 0 38px',
            color: '#ffffff',
            fontSize: '16px', // Previne auto-zoom no Safari/iOS
            outline: 'none',
          }}
        />
        {busca && (
          <button
            type="button"
            onClick={() => onBuscaChange('')}
            aria-label="Limpar busca"
            style={{
              position: 'absolute',
              right: '6px',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#1c1c21',
              border: 'none',
              color: '#a1a1aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Linha de Filtros: Loja, Caixa, Ordenação */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
        }}
      >
        {/* Seletor de Loja */}
        <select
          value={loja}
          onChange={(e) => {
            onLojaChange(e.target.value);
            onCaixaChange(''); // Reseta caixa ao trocar loja
          }}
          aria-label="Filtrar por loja"
          style={{
            height: '44px',
            backgroundColor: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '0 10px',
            color: '#e4e4e7',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Todas as Lojas</option>
          <option value="Loja 1">Loja 1</option>
          <option value="Loja 2">Loja 2</option>
        </select>

        {/* Seletor de Caixa */}
        <select
          value={caixa}
          onChange={(e) => onCaixaChange(e.target.value)}
          aria-label="Filtrar por caixa"
          style={{
            height: '44px',
            backgroundColor: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '0 10px',
            color: '#e4e4e7',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Todas as Caixas</option>
          {caixas.map((cx) => (
            <option key={cx.caixa} value={cx.caixa}>
              {cx.label} {cx.total > 0 ? `(${cx.total})` : ''}
            </option>
          ))}
        </select>

        {/* Seletor de Ordenação */}
        <select
          value={ordenacao}
          onChange={(e) => onOrdenacaoChange(e.target.value)}
          aria-label="Ordenar itens"
          style={{
            height: '44px',
            backgroundColor: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '0 10px',
            color: '#e4e4e7',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="padrao">Ordem Padrão</option>
          <option value="preco_asc">Preço: Menor primeiro</option>
          <option value="preco_desc">Preço: Maior primeiro</option>
          {isVideo ? (
            <option value="titulo_asc">Título: A–Z</option>
          ) : (
            <option value="artista_asc">Artista: A–Z</option>
          )}
        </select>
      </div>
    </div>
  );
}
