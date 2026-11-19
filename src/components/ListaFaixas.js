import { agruparPorLado } from '@/utils/faixas';

/** Lista de faixas do disco, por lado (Lado A, Lado B). */
export default function ListaFaixas({ faixas = [], fonte, className = '' }) {
  if (!faixas.length) return null;
  const grupos = agruparPorLado(faixas);

  return (
    <section className={`faixas ${className}`} aria-labelledby="faixas-titulo">
      <h2 id="faixas-titulo" className="faixasTitulo">
        Faixas
      </h2>
      <div className={`faixasLados${grupos.length > 1 ? ' faixasLados-varios' : ''}`}>
      {grupos.map((g, i) => (
        <div key={`${g.chave}-${i}`} className="faixasLado">
          {g.nome && <h3 className="faixasLadoNome">{g.nome}</h3>}
          <ol className="faixasLista tabularNums">
            {g.faixas.map((f, j) => (
              <li key={`${f.posicao}-${j}`} className="faixa">
                <span className="faixaNumero" aria-hidden="true">
                  {f.numero}
                </span>
                <span className="faixaNome">{f.titulo}</span>
                {f.duracao && <span className="faixaDuracao">{f.duracao}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
      </div>
      {fonte && (
        <p className="faixasFonte">
          Dados do{' '}
          <a href={fonte} target="_blank" rel="noopener noreferrer">
            Discogs
          </a>
        </p>
      )}
    </section>
  );
}
