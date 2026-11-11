'use client';

const COR_LOJA = { 'Loja 1': 'var(--loja-1)', 'Loja 2': 'var(--loja-2)' };

const ORDENS = [
  { id: 'padrao', label: 'Por caixa' },
  { id: 'preco_asc', label: 'Menor preço' },
  { id: 'preco_desc', label: 'Maior preço' },
  { id: 'artista_asc', label: 'Artista A–Z' },
  { id: 'titulo_asc', label: 'Título A–Z' },
];

function Opcao({ ativa, onClick, children, extra }) {
  return (
    <button
      type="button"
      className={`edLatOpcao ${ativa ? 'edLatOpcaoAtiva' : ''}`}
      aria-pressed={ativa}
      onClick={onClick}
    >
      <span className="edLatOpcaoNome">{children}</span>
      {extra != null && <span className="edLatOpcaoExtra tabularNums">{extra}</span>}
    </button>
  );
}

/**
 * Coluna de filtros do catálogo no computador (a partir de 1024px; escondida abaixo disso).
 * Faz o trabalho das listas de loja, caixa e ordem, sempre visível (o formato fica nas abas do topo).
 */
export default function FiltrosLaterais({
  loja,
  onLoja,
  caixa,
  onCaixa,
  caixas = [],
  ordenacao,
  onOrdenacao,
}) {
  const contarCaixas = (nome) => caixas.filter((c) => c.loja === nome).length;
  const caixasDaLoja = loja ? caixas.filter((c) => !c.loja || c.loja === loja) : [];

  return (
    <aside className="edLateral" aria-label="Filtros do catálogo">
      <section className="edLatGrupo">
        <h2 className="edLatTitulo">Loja</h2>
        <Opcao ativa={!loja} onClick={() => onLoja('')}>
          Todas
        </Opcao>
        {['Loja 1', 'Loja 2'].map((nome) => (
          <Opcao
            key={nome}
            ativa={loja === nome}
            onClick={() => onLoja(nome)}
            extra={!loja && contarCaixas(nome) ? `${contarCaixas(nome)} cx` : null}
          >
            <span className="edPonto" style={{ backgroundColor: COR_LOJA[nome] }} aria-hidden="true" />
            {nome}
          </Opcao>
        ))}
      </section>

      <section className="edLatGrupo">
        <h2 className="edLatTitulo">Caixa</h2>
        {!loja ? (
          <p className="edLatDica">Escolha a loja para ver as caixas.</p>
        ) : (
          <>
            <Opcao ativa={!caixa} onClick={() => onCaixa('')}>
              Todas as caixas
            </Opcao>
            <div className="edLatCaixas">
              {caixasDaLoja.map((cx) => {
                const ativa = String(caixa) === String(cx.caixa);
                const numero = String(cx.label).replace(/^caixa\s*/i, '');
                return (
                  <button
                    key={cx.caixa}
                    type="button"
                    className={`edLatCaixa tabularNums ${ativa ? 'edLatCaixaAtiva' : ''} ${cx.total ? '' : 'edLatCaixaVazia'}`}
                    aria-pressed={ativa}
                    aria-label={`${cx.label}, ${cx.total || 0} ${cx.total === 1 ? 'item' : 'itens'}`}
                    onClick={() => onCaixa(ativa ? '' : cx.caixa)}
                  >
                    {numero}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="edLatGrupo">
        <h2 className="edLatTitulo">Ordenar</h2>
        {ORDENS.map((o) => (
          <Opcao key={o.id} ativa={(ordenacao || 'padrao') === o.id} onClick={() => onOrdenacao(o.id)}>
            {o.label}
          </Opcao>
        ))}
      </section>
    </aside>
  );
}
