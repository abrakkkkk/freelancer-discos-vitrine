'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Botao from './Botao';

// No celular só cabem as setas e "Página X de Y"; os números aparecem a partir de 768px.
export default function CatalogPagination({ pagina, totalPaginas, onPageChange }) {
  if (totalPaginas <= 1) return null;

  const irPara = (novaPagina) => {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === pagina) return;
    onPageChange(novaPagina);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const paginas = Array.from(new Set([1, pagina - 1, pagina, pagina + 1, totalPaginas]))
    .filter((p) => p >= 1 && p <= totalPaginas)
    .sort((a, b) => a - b);

  const noInicio = pagina <= 1;
  const noFim = pagina >= totalPaginas;

  return (
    <nav aria-label="Paginação do catálogo" className="paginacao tabularNums">
      <Botao icone disabled={noInicio} onClick={() => irPara(pagina - 1)} aria-label="Página anterior">
        <FiChevronLeft size={18} aria-hidden="true" />
      </Botao>

      <p className="paginacaoResumo" aria-live="polite">
        Página <strong>{pagina}</strong> de {totalPaginas}
      </p>

      <ol className="paginacaoNumeros">
        {paginas.map((p, i) => {
          const pulo = i > 0 && p - paginas[i - 1] > 1;
          const atual = p === pagina;
          return (
            <li key={p}>
              {pulo && (
                <span className="paginacaoPulo" aria-hidden="true">
                  …
                </span>
              )}
              <Botao
                variante={atual ? 'primario' : 'terciario'}
                className="paginacaoNumero"
                aria-current={atual ? 'page' : undefined}
                aria-label={`Página ${p}`}
                onClick={() => irPara(p)}
              >
                {p}
              </Botao>
            </li>
          );
        })}
      </ol>

      <Botao icone disabled={noFim} onClick={() => irPara(pagina + 1)} aria-label="Próxima página">
        <FiChevronRight size={18} aria-hidden="true" />
      </Botao>
    </nav>
  );
}
