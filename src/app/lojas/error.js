'use client';

import { useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { BarraEditorial } from '@/editorial/NavEditorial';
import Botao from '@/components/Botao';

// Falha do banco ao carregar lojas/caixas, para não aparecer como "0 itens" (estoque zerado).
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
          <Botao variante="primario" onClick={() => retry()} prefixo={<FiRefreshCw size={15} aria-hidden="true" />}>
            Tentar de novo
          </Botao>
          <Botao href="/">Ir para o catálogo</Botao>
        </div>
      </div>

      <BarraEditorial />
    </div>
  );
}
