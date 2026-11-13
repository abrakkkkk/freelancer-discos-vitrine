'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { FiTruck } from 'react-icons/fi';
import { useCart } from '@/components/CartProvider';
import { WHATSAPP_PHONE } from '@/utils/cartUtils';
import ListaEditorial from './ListaEditorial';

export function FaixaServico({ className = '' }) {
  return (
    <div className={`vlFaixa ${className}`.trim()}>
      <p className="vlFaixaItem">
        <FiTruck size={15} aria-hidden="true" />
        Entregas para todo o Brasil
      </p>
      <span className="vlFaixaDivisor" aria-hidden="true" />
      <a className="vlFaixaItem" href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noopener noreferrer">
        <FaWhatsapp size={15} aria-hidden="true" />
        <span className="vlFaixaLongo">Também estamos disponíveis no </span>WhatsApp
      </a>
    </div>
  );
}

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
      {hero.capas.map((d, i) => (
        <CapaPilha key={d.id} disco={d} className={`vlPilha${i + 1}`} />
      ))}
      {hero.destaque && <CapaPilha disco={hero.destaque} className="vlPilhaDestaque" />}
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

  return (
    <div className="vlVitrine">
      <section className="vlAbertura" aria-label="Freelancer Discos">
        <div className="vlAberturaTextos">
          <h2 className="vlAberturaTitulo tabularNums">
            {vitrine.total ? `${vitrine.total.toLocaleString('pt-BR')} discos em` : 'Discos em'}
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
                <span className="vlSoCelular">Ver o </span>catálogo completo
              </a>
              .
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
