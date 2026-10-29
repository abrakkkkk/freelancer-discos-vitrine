'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import BottomNav from '@/components/BottomNav';

// Mostrado quando o banco falha ao carregar lojas/caixas. Antes, a falha aparecia
// como "0 itens" ou "caixa vazia", o que parecia estoque zerado.
export default function LojasError({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pageContainer">
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px',
          padding: '48px 16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <FiAlertTriangle size={28} color="#d4a373" aria-hidden="true" />
        <h1 className="headerTitle">Não foi possível carregar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px' }}>
          Houve uma falha ao consultar o estoque. Tente de novo em alguns segundos.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => retry()}
            className="productCardActionBtn"
            style={{ padding: '0 16px', fontSize: '14px' }}
          >
            <FiRefreshCw size={15} />
            Tentar de novo
          </button>
          <Link href="/" className="textBtn" style={{ textDecoration: 'none' }}>
            Ir para o catálogo
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
