'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function CatalogPagination({ pagina, totalPaginas, onPageChange }) {
  if (totalPaginas <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '24px',
        padding: '12px 0',
      }}
    >
      <button
        type="button"
        disabled={pagina <= 1}
        onClick={() => onPageChange(pagina - 1)}
        style={{
          minWidth: '44px',
          minHeight: '44px',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: '#151518',
          border: '1px solid #232328',
          color: pagina <= 1 ? '#52525b' : '#e4e4e7',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: pagina <= 1 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <FiChevronLeft size={18} />
        <span>Anterior</span>
      </button>

      <span style={{ fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
        {pagina} de {totalPaginas}
      </span>

      <button
        type="button"
        disabled={pagina >= totalPaginas}
        onClick={() => onPageChange(pagina + 1)}
        style={{
          minWidth: '44px',
          minHeight: '44px',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: '#151518',
          border: '1px solid #232328',
          color: pagina >= totalPaginas ? '#52525b' : '#e4e4e7',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <span>Próxima</span>
        <FiChevronRight size={18} />
      </button>
    </div>
  );
}
