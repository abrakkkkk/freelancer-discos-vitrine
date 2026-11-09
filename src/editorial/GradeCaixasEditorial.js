'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';
import { ed } from './rotas';

/** Índice de caixas da loja: o número da caixa em destaque, como a lombada de uma pasta. */
export default function GradeCaixasEditorial({ caixas = [], lojaSlug, nomeLoja }) {
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return caixas;
    return caixas.filter(
      (cx) => String(cx.caixa).toLowerCase().includes(termo) || String(cx.label).toLowerCase().includes(termo)
    );
  }, [caixas, busca]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <FiSearch size={18} color="#8a8a93" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
        <input
          type="search"
          inputMode="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Número da caixa"
          aria-label="Filtrar caixas pelo número"
          className="fieldInput"
        />
        {busca && (
          <button type="button" onClick={() => setBusca('')} aria-label="Limpar filtro de caixa" className="inputClearBtn">
            <FiX size={16} />
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <p style={{ padding: '32px 4px', textAlign: 'center', fontSize: '14px', color: '#a1a1aa' }}>
          Nenhuma caixa &ldquo;{busca}&rdquo; em {nomeLoja}.
        </p>
      ) : (
        <ul className="edCaixas">
          {filtradas.map((cx) => {
            const numero = String(cx.label).replace(/^caixa\s*/i, '');
            const vazia = !cx.total;
            return (
              <li key={cx.caixa}>
                <Link
                  href={ed(`/lojas/${lojaSlug}/${encodeURIComponent(cx.caixa)}`)}
                  className={`edCaixa tabularNums ${vazia ? 'edCaixaVazia' : ''}`}
                  // Fio de cima na cor da loja (vermelho na Loja 1, azul na Loja 2).
                  style={{ '--cor-loja': nomeLoja === 'Loja 2' ? 'var(--loja-2)' : 'var(--loja-1)' }}
                  aria-label={`${cx.label}, ${cx.total} ${cx.total === 1 ? 'item' : 'itens'}`}
                >
                  <span className="edCaixaRotulo">Caixa</span>
                  <span className="edCaixaNumero">{numero}</span>
                  <span className="edCaixaItens">
                    {vazia ? 'Vazia' : `${cx.total.toLocaleString('pt-BR')} ${cx.total === 1 ? 'item' : 'itens'}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
