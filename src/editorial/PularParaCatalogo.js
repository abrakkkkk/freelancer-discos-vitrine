'use client';

import { usePathname } from 'next/navigation';

// Atalho de teclado da página inicial, antes da faixa: é a primeira parada do Tab.
// Fica fora da tela até receber foco. Desce até "Todo o estoque" e foca o primeiro disco.
export default function PularParaCatalogo() {
  if (usePathname() !== '/') return null;

  const irParaCatalogo = (e) => {
    const alvo =
      [...document.querySelectorAll('[data-todo-o-estoque]')].find((el) => el.offsetParent) ||
      document.querySelector('.edBuscaCatalogo');
    if (!alvo) return;
    e.preventDefault();
    alvo.scrollIntoView({ block: 'start' });
    const primeiro = [...document.querySelectorAll('.edGrupos .edTitulo')].find((el) => el.offsetParent);
    primeiro?.focus({ preventScroll: true });
  };

  return (
    <a href="#conteudo" className="pularParaCatalogo" onClick={irParaCatalogo}>
      Ir para o catálogo
    </a>
  );
}
