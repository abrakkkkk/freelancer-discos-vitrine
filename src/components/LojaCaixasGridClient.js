'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';

export default function LojaCaixasGridClient({ caixas = [], lojaSlug, nomeLoja }) {
  const [buscaCaixa, setBuscaCaixa] = useState('');

  const maxTotal = useMemo(
    () => caixas.reduce((max, c) => (c.total > max ? c.total : max), 1),
    [caixas]
  );

  const caixasFiltradas = useMemo(() => {
    const termo = buscaCaixa.trim().toLowerCase();
    if (!termo) return caixas;
    return caixas.filter(
      (cx) =>
        String(cx.caixa).toLowerCase().includes(termo) ||
        String(cx.label).toLowerCase().includes(termo)
    );
  }, [caixas, buscaCaixa]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <FiSearch
          size={18}
          color="#71717a"
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
        />
        <input
          type="search"
          inputMode="search"
          value={buscaCaixa}
          onChange={(e) => setBuscaCaixa(e.target.value)}
          placeholder="Número da caixa"
          aria-label="Filtrar caixas pelo número"
          className="fieldInput"
        />
        {buscaCaixa && (
          <button
            type="button"
            onClick={() => setBuscaCaixa('')}
            aria-label="Limpar filtro de caixa"
            className="inputClearBtn"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {caixasFiltradas.length === 0 ? (
        <p style={{ padding: '32px 4px', textAlign: 'center', fontSize: '14px', color: '#a1a1aa' }}>
          Nenhuma caixa &ldquo;{buscaCaixa}&rdquo; em {nomeLoja}.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
          }}
        >
          {caixasFiltradas.map((cx) => {
            const hasItems = cx.total > 0;
            const fillPct = hasItems
              ? Math.max(8, Math.min(100, Math.round((cx.total / maxTotal) * 100)))
              : 0;

            return (
              <Link
                key={cx.caixa}
                href={`/lojas/${lojaSlug}/${encodeURIComponent(cx.caixa)}`}
                className="productCard tabularNums"
                style={{
                  gap: '6px',
                  padding: '12px',
                  textDecoration: 'none',
                  opacity: hasItems ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{cx.label}</span>
                <span style={{ fontSize: '12.5px', color: '#a1a1aa' }}>
                  {cx.total.toLocaleString('pt-BR')} {cx.total === 1 ? 'item' : 'itens'}
                </span>
                {/* Ocupação relativa da caixa */}
                <div
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: '#27272a',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '2px',
                  }}
                >
                  <div style={{ width: `${fillPct}%`, height: '100%', backgroundColor: '#8b1e1e' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
