import Link from 'next/link';
import { MdStorefront, MdChevronRight } from 'react-icons/md';
import { caixaService } from '@/services/caixaService';
import BottomNav from '@/components/BottomNav';

export const revalidate = 60;

export default async function LojasPage() {
  const totais = await caixaService.getTotaisLojas();

  const lojas = [
    {
      id: 'loja-1',
      nome: 'Loja 1',
      descricao: 'Loja Principal · Caixas 1 a 55',
      total: totais['Loja 1'] || 0,
    },
    {
      id: 'loja-2',
      nome: 'Loja 2',
      descricao: 'Segunda Unidade · Caixas 1B a 20B',
      total: totais['Loja 2'] || 0,
    },
  ];

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
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#18181c',
            border: '1px solid #2d2d35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.jpg"
            alt="Freelancer Discos"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
            Lojas Físicas
          </h1>
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
            Selecione a loja para explorar o acervo caixa por caixa
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {lojas.map((lj) => (
          <Link
            key={lj.id}
            href={`/lojas/${lj.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 16px',
              backgroundColor: '#151518',
              border: '1px solid #232328',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#1c1c21',
                  border: '1px solid #2d2d35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MdStorefront size={26} color="#8b1e1e" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  {lj.nome}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#a1a1aa', marginTop: '2px' }}>
                  {lj.descricao}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#8b1e1e',
                  }}
                >
                  {lj.total} {lj.total === 1 ? 'item disponível' : 'itens disponíveis'}
                </span>
              </div>
            </div>

            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#1c1c21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a1a1aa',
              }}
            >
              <MdChevronRight size={22} />
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
