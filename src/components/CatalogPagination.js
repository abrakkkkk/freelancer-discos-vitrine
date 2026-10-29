'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function CatalogPagination({ pagina, totalPaginas, onPageChange }) {
  if (totalPaginas <= 1) return null;

  const handleGoTo = (novaPagina) => {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === pagina) return;
    onPageChange(novaPagina);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const visiblePages = Array.from(new Set([1, pagina - 1, pagina, pagina + 1, totalPaginas]))
    .filter((p) => p >= 1 && p <= totalPaginas)
    .sort((a, b) => a - b);

  const navBtnStyle = (disabled) => ({
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    backgroundColor: '#151518',
    border: '1px solid #232328',
    color: disabled ? '#3f3f46' : '#e4e4e7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0,
  });

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="tabularNums"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '24px',
      }}
    >
      <button
        type="button"
        disabled={pagina <= 1}
        onClick={() => handleGoTo(pagina - 1)}
        aria-label="Página anterior"
        style={navBtnStyle(pagina <= 1)}
      >
        <FiChevronLeft size={18} />
      </button>

      {visiblePages.map((p, idx) => {
        const prev = visiblePages[idx - 1];
        const showEllipsis = prev && p - prev > 1;
        const isCurrent = p === pagina;

        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showEllipsis && (
              <span aria-hidden="true" style={{ color: '#52525b', fontSize: '13px' }}>
                …
              </span>
            )}
            <button
              type="button"
              onClick={() => handleGoTo(p)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Página ${p}`}
              style={{
                minWidth: '44px',
                height: '44px',
                padding: '0 8px',
                borderRadius: '8px',
                backgroundColor: isCurrent ? '#8b1e1e' : '#151518',
                border: isCurrent ? '1px solid #8b1e1e' : '1px solid #232328',
                color: isCurrent ? '#ffffff' : '#a1a1aa',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: isCurrent ? 'default' : 'pointer',
              }}
            >
              {p}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        disabled={pagina >= totalPaginas}
        onClick={() => handleGoTo(pagina + 1)}
        aria-label="Próxima página"
        style={navBtnStyle(pagina >= totalPaginas)}
      >
        <FiChevronRight size={18} />
      </button>
    </nav>
  );
}
