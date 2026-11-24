'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiX, FiChevronRight } from 'react-icons/fi';

// Só os maiores gêneros: "Todos os gêneros" fica perto, a pouca rolagem.
const GENEROS_NA_LINHA = 4;

/**
 * Gêneros do catálogo no celular, logo abaixo da busca (escondida a partir de 1024px, onde ficam
 * os filtros laterais), numa linha que rola para o lado.
 * O gênero escolhido vai para o começo, com o "×" para tirar.
 */
export default function LinhaGeneros({ generos = [], genero = '', onGenero }) {
  const linhaRef = useRef(null);

  // Ao escolher ou tirar um gênero, a linha volta ao começo: o escolhido fica à vista.
  useEffect(() => {
    linhaRef.current?.scrollTo({ left: 0, behavior: 'instant' });
  }, [genero]);

  if (!generos.length) return null;
  const ativo = generos.find((g) => g.id === genero);
  const lista = (ativo ? [ativo, ...generos.filter((g) => g.id !== genero)] : generos).slice(0, GENEROS_NA_LINHA);

  return (
    <nav className="edGeneros" aria-label="Gêneros">
      <div className="edGenerosLinha" ref={linhaRef}>
        {lista.map((g) =>
          g.id === genero ? (
            <button
              key={g.id}
              type="button"
              className="edGenero edGeneroAtivo"
              aria-pressed="true"
              aria-label={`${g.nome}, tirar filtro`}
              onClick={() => onGenero('')}
            >
              {g.nome}
              <FiX size={15} aria-hidden="true" />
            </button>
          ) : (
            <button key={g.id} type="button" className="edGenero" aria-pressed="false" onClick={() => onGenero(g.id)}>
              {g.nome}
            </button>
          )
        )}
        <Link href="/generos" className="edGenero edGeneroTodos">
          Todos os gêneros
          <FiChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
