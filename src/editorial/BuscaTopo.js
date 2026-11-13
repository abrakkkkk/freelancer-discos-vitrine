'use client';

import { FiSearch, FiX } from 'react-icons/fi';

// Busca no cabeçalho (versão loja, só no computador). Usa o mesmo estado da busca do catálogo.
export default function BuscaTopo({ busca, onBuscaChange, placeholder, rotulo }) {
  return (
    <form className="edBuscaTopo" role="search" onSubmit={(e) => e.preventDefault()}>
      <FiSearch size={18} className="edBuscaTopoIcone" aria-hidden="true" />
      <input
        id="busca-topo"
        type="search"
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        placeholder={placeholder}
        aria-label={rotulo}
        aria-keyshortcuts="/"
        className="fieldInput"
      />
      {busca ? (
        <button type="button" onClick={() => onBuscaChange('')} aria-label="Limpar busca" className="inputClearBtn">
          <FiX size={16} />
        </button>
      ) : (
        <kbd className="atalhoBusca" aria-hidden="true">/</kbd>
      )}
    </form>
  );
}
