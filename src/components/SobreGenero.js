import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';

export const hrefDoGenero = (id) => `/?genero=${id}`;

/**
 * Link para o catálogo filtrado pelo gênero. Na folha que abre por cima do catálogo,
 * `onGenero` troca o filtro ali mesmo (o catálogo já está montado e não relê a URL).
 */
export function LinkGenero({ genero, onGenero, className = '', children }) {
  if (onGenero) {
    return (
      <button type="button" className={`linkGenero ${className}`.trim()} onClick={() => onGenero(genero.id)}>
        {children}
      </button>
    );
  }
  return (
    <Link href={hrefDoGenero(genero.id)} className={`linkGenero ${className}`.trim()}>
      {children}
    </Link>
  );
}

/** Linha "Gênero" da ficha do disco: um ou dois gêneros, cada um levando ao catálogo filtrado. */
export function LinhaFichaGenero({ generos, onGenero }) {
  if (!generos.length) return null;
  return (
    <div className="specRow">
      <dt>Gênero</dt>
      <dd>
        {generos.map((g, i) => (
          <span key={g.id}>
            {i > 0 && <span className="specSeparador" aria-hidden="true">·</span>}
            <LinkGenero genero={g} onGenero={onGenero}>
              {g.nome}
            </LinkGenero>
          </span>
        ))}
      </dd>
    </div>
  );
}

/** Descrição do gênero principal do disco, numa seção própria depois das faixas. */
export default function SobreGenero({ genero, onGenero, className = '' }) {
  if (!genero) return null;
  return (
    <section className={`sobreGenero ${className}`.trim()} aria-labelledby="sobre-genero-titulo">
      <div className="sobreGeneroCab">
        <h2 id="sobre-genero-titulo" className="faixasTitulo">
          {genero.nome}
        </h2>
        <LinkGenero genero={genero} onGenero={onGenero} className="sobreGeneroLink">
          Ver gênero
          <FiChevronRight size={16} aria-hidden="true" />
        </LinkGenero>
      </div>
      <p className="sobreGeneroTexto">{genero.descricao}</p>
    </section>
  );
}
