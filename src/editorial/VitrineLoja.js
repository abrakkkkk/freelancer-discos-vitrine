'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowDown } from 'react-icons/fi';
import { useCart } from '@/components/CartProvider';
import ListaEditorial from './ListaEditorial';
import { TotalEstoqueContext } from './totalEstoque';

function Prateleira({ titulo, itens, estaNaSacola, adicionar, abrir }) {
  if (!itens?.length) return null;
  return (
    <section className="vlPrateleira" aria-label={titulo}>
      <div className="edCaixaCab">
        <h2 className="edCaixaNum">{titulo}</h2>
      </div>
      <ListaEditorial
        itens={itens}
        categoria="discos"
        agruparPorCaixa={false}
        estaNaSacola={estaNaSacola}
        onAdicionar={adicionar}
        onAbrir={abrir}
      />
    </section>
  );
}

function CapaPilha({ disco, className }) {
  return (
    <Link href={`/disco/discos/${disco.id}`} className={`vlPilhaCapa ${className}`} title={`${disco.artista} — ${disco.titulo}`}>
      <img src={disco.capa_url} alt={`${disco.artista} — ${disco.titulo}`} decoding="async" />
    </Link>
  );
}

// Capas soltas como na bancada da loja, a do destaque por cima.
function Pilha({ hero }) {
  if (!hero?.destaque && !hero?.capas?.length) return null;
  return (
    <div className="vlPilha">
      {/* O destaque vem primeiro na ordem do Tab; o z-index o mantém por cima das outras. */}
      {hero.destaque && <CapaPilha disco={hero.destaque} className="vlPilhaDestaque" />}
      {hero.capas.map((d, i) => (
        <CapaPilha key={d.id} disco={d} className={`vlPilha${i + 1}`} />
      ))}
    </div>
  );
}

// Desce até o título "Todo o estoque" que estiver visível (no celular ele fica depois das prateleiras).
function irParaEstoque(e) {
  const alvo = [...document.querySelectorAll('[data-todo-o-estoque]')].find((el) => el.offsetParent);
  if (!alvo) return;
  e.preventDefault();
  alvo.scrollIntoView({ block: 'start' });
}

export default function VitrineLoja({ vitrine }) {
  const router = useRouter();
  const { estaNaSacola, adicionar } = useCart();
  const abrir = (item) => router.push(`/disco/discos/${item.id}`);
  const comuns = { estaNaSacola, adicionar, abrir };
  // Mesmo número de "Todo o estoque" quando o catálogo já contou; senão, o do servidor.
  const total = useContext(TotalEstoqueContext) || vitrine.total;

  return (
    <div className="vlVitrine">
      <section className="vlAbertura" aria-label="Freelancer Discos">
        <div className="vlAberturaTextos">
          <h2 className="vlAberturaTitulo tabularNums">
            {/* Celular: "12.700 / DISCOS EM / ESTOQUE". Computador: "12.700 DISCOS EM / ESTOQUE". */}
            {total > 0 && <span className="vlTituloNumero">{total.toLocaleString('pt-BR')} </span>}
            {total > 0 ? 'discos em' : 'Discos em'}
            {' '}<br />
            estoque
          </h2>
          <p className="vlAberturaTexto">
            {/* No celular a frase é mais curta: "Atualizado a cada venda. Ver o catálogo completo." */}
            <span className="vlSoDesktop">O acervo das lojas em um só lugar, atualizado a cada venda. </span>
            <span className="vlSoCelular">Atualizado a cada venda. </span>
            <span className="vlAberturaLinha">
              <span className="vlSoDesktop">Confira também nosso </span>
              <a href="#todo-o-estoque" className="vlAberturaLink" onClick={irParaEstoque}>
                <span>
                  <span className="vlSoCelular">Ver o </span>catálogo completo
                </span>
                <FiArrowDown size={14} className="vlSoCelular vlAberturaSeta" aria-hidden="true" />
              </a>
              <span className="vlSoDesktop">.</span>
            </span>
          </p>
        </div>
        <Pilha hero={vitrine.hero} />
      </section>

      <Prateleira titulo="Chegaram agora" itens={vitrine.chegaram} {...comuns} />
      <Prateleira titulo="Em destaque" itens={vitrine.destaques} {...comuns} />
      <Prateleira titulo="Importados" itens={vitrine.importados} {...comuns} />
    </div>
  );
}
