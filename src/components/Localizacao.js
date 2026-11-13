import { formatCaixa } from '@/utils/stringUtils';

const COR_LOJA = { 'Loja 1': 'var(--loja-1)', 'Loja 2': 'var(--loja-2)' };

// Onde o item está (loja e caixa). Usado no card, no detalhe e na sacola;
// muda só o tamanho.
export default function Localizacao({ caixa, loja, tamanho = 'card', className = '' }) {
  const rotulo = formatCaixa(caixa, loja);
  const temCaixa = rotulo !== '—';
  return (
    <span className={`edLocal edLocal-${tamanho} tabularNums ${className}`.trim()}>
      <span
        className="edPonto"
        style={{ backgroundColor: COR_LOJA[loja] || 'var(--badge-neutral)' }}
        aria-hidden="true"
      />
      <span>{temCaixa ? rotulo : 'Caixa não informada'}</span>
      {loja && <span className="edLocalLoja">{loja}</span>}
    </span>
  );
}
