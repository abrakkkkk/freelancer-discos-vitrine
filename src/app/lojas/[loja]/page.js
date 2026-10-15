import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { caixaService } from '@/services/caixaService';
import BottomNav from '@/components/BottomNav';

export const revalidate = 60;

export default async function LojaCaixasPage({ params }) {
  const { loja: lojaSlug } = await params;

  let nomeLoja = '';
  if (lojaSlug === 'loja-1') nomeLoja = 'Loja 1';
  else if (lojaSlug === 'loja-2') nomeLoja = 'Loja 2';
  else notFound();

  const caixas = await caixaService.getCaixasComContagem(nomeLoja);

  return (
    <div className="pageContainer">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #232328',
        }}
      >
        <Link
          href="/lojas"
          aria-label="Voltar para Lojas"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#151518',
            border: '1px solid #232328',
            color: '#e4e4e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            {nomeLoja} — Caixas
          </h1>
          <p style={{ fontSize: '12.5px', color: '#a1a1aa' }}>
            Selecione uma caixa para ver os itens disponíveis
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        {caixas.map((cx) => (
          <Link
            key={cx.caixa}
            href={`/lojas/${lojaSlug}/${encodeURIComponent(cx.caixa)}`}
            style={{
              padding: '14px 12px',
              backgroundColor: '#151518',
              border: cx.total > 0 ? '1px solid #2d2d35' : '1px solid #232328',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'border-color 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              {cx.label}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: cx.total > 0 ? '#8b1e1e' : '#52525b',
              }}
            >
              {cx.total} {cx.total === 1 ? 'item' : 'itens'}
            </span>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
