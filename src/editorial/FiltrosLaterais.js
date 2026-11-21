'use client';

import { useState } from 'react';

const COR_LOJA = { 'Loja 1': 'var(--loja-1)', 'Loja 2': 'var(--loja-2)' };

const ORDENS = [
  { id: 'padrao', label: 'Por caixa' },
  { id: 'preco_asc', label: 'Menor preço' },
  { id: 'preco_desc', label: 'Maior preço' },
  { id: 'artista_asc', label: 'Artista A–Z' },
  { id: 'titulo_asc', label: 'Título A–Z' },
];

// Gêneros visíveis antes de "Ver todos": os maiores, que cobrem quase todo o estoque.
const GENEROS_VISIVEIS = 8;

function Escolha({ ativa, onClick, children }) {
  return (
    <button
      type="button"
      className={`edLatEscolha ${ativa ? 'edLatEscolhaAtiva' : ''}`}
      aria-pressed={ativa}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Coluna de filtros do catálogo no computador (escondida abaixo de 1024px). */
export default function FiltrosLaterais({
  loja,
  onLoja,
  caixa,
  onCaixa,
  caixas = [],
  ordenacao,
  onOrdenacao,
  // [{ id, nome, total }] já na ordem de exibição; vazio esconde o grupo.
  generos = [],
  genero = '',
  onGenero,
}) {
  const [todosGeneros, setTodosGeneros] = useState(false);
  const ativoEscondido = generos.findIndex((g) => g.id === genero) >= GENEROS_VISIVEIS;
  const generosVisiveis = todosGeneros || ativoEscondido ? generos : generos.slice(0, GENEROS_VISIVEIS);

  // Caixas com nome (como "Painel 2") não cabem no quadradinho: vão para o fim, em duas colunas.
  const comNome = (cx) => /\s/.test(String(cx.label).replace(/^caixa\s*/i, ''));
  const caixasDaLoja = loja
    ? caixas
        .filter((c) => !c.loja || c.loja === loja)
        .sort((a, b) => Number(comNome(a)) - Number(comNome(b)))
    : [];

  return (
    <aside className="edLateral" aria-label="Filtros do catálogo">
      {generos.length > 0 && (
        <section className="edLatGrupo">
          <div className="edLatTituloLinha">
            <h2 className="edLatTitulo">Gênero</h2>
            {genero && (
              <button type="button" className="edLatLimpar" onClick={() => onGenero('')}>
                Limpar
              </button>
            )}
          </div>
          <div className="edLatGeneros">
            {generosVisiveis.map((g) => {
              const ativo = genero === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`edLatOpcao ${ativo ? 'edLatOpcaoAtiva' : ''}`}
                  aria-pressed={ativo}
                  onClick={() => onGenero(ativo ? '' : g.id)}
                >
                  <span className="edLatOpcaoNome">{g.nome}</span>
                  <span className="edLatOpcaoExtra tabularNums">{g.total.toLocaleString('pt-BR')}</span>
                </button>
              );
            })}
          </div>
          {generos.length > GENEROS_VISIVEIS && !ativoEscondido && (
            <button type="button" className="edLatLimpar edLatMais" onClick={() => setTodosGeneros((v) => !v)}>
              {todosGeneros ? 'Ver menos' : `Ver todos os ${generos.length}`}
            </button>
          )}
        </section>
      )}

      <section className="edLatGrupo edLatGrupoLoja">
        <h2 className="edLatTitulo">Loja</h2>
        <div className="edLatEscolhas">
          <Escolha ativa={!loja} onClick={() => onLoja('')}>
            Todas
          </Escolha>
          {['Loja 1', 'Loja 2'].map((nome) => (
            <Escolha key={nome} ativa={loja === nome} onClick={() => onLoja(nome)}>
              <span className="edPonto" style={{ backgroundColor: COR_LOJA[nome] }} aria-hidden="true" />
              {nome}
            </Escolha>
          ))}
        </div>
      </section>

      <section className="edLatGrupo">
        <div className="edLatTituloLinha">
          <h2 className="edLatTitulo">Caixa</h2>
          {caixa && (
            <button type="button" className="edLatLimpar" onClick={() => onCaixa('')}>
              Limpar
            </button>
          )}
        </div>
        {!loja ? (
          <p className="edLatDica">Escolha a loja para ver as caixas.</p>
        ) : (
          <div className="edLatCaixas">
            {caixasDaLoja.map((cx) => {
              const ativa = String(caixa) === String(cx.caixa);
              const numero = String(cx.label).replace(/^caixa\s*/i, '');
              return (
                <button
                  key={cx.caixa}
                  type="button"
                  className={`edLatCaixa tabularNums ${ativa ? 'edLatCaixaAtiva' : ''} ${cx.total ? '' : 'edLatCaixaVazia'} ${comNome(cx) ? 'edLatCaixaLarga' : ''}`}
                  aria-pressed={ativa}
                  aria-label={`${cx.label}, ${cx.total || 0} ${cx.total === 1 ? 'item' : 'itens'}`}
                  onClick={() => onCaixa(ativa ? '' : cx.caixa)}
                >
                  {numero}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="edLatGrupo edLatGrupoOrdem">
        <h2 className="edLatTitulo">Ordenar</h2>
        <div className="edLatEscolhas">
          {ORDENS.map((o) => (
            <Escolha key={o.id} ativa={(ordenacao || 'padrao') === o.id} onClick={() => onOrdenacao(o.id)}>
              {o.label}
            </Escolha>
          ))}
        </div>
      </section>
    </aside>
  );
}
