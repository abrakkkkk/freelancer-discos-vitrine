import { PiArrowUpBold, PiInstagramLogoBold, PiWhatsappLogoBold } from 'react-icons/pi';
import { LOJA } from '@/utils/dadosEstruturados';

// Fecho das páginas no computador: onde fica, quando abre e como falar com a loja, numa linha.
// No celular não aparece: a barra de baixo já leva ao Contato.
export default function RodapeLoja() {
  return (
    <footer className="rodapeLoja">
      <div className="rodapeLojaLinha">
        <p className="rodapeLojaNome">Freelancer Discos</p>
        <p className="rodapeLojaInfo">
          <a href={LOJA.mapa} target="_blank" rel="noopener noreferrer" className="rodapeLojaLink">
            {LOJA.rua} · Centro, Fortaleza
          </a>
          <span aria-hidden="true">·</span>
          <span>Seg a sex 9h–17h, sáb 9h–15h</span>
        </p>
        <nav className="rodapeLojaAcoes" aria-label="Contato">
          <a
            href={`https://wa.me/${LOJA.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rodapeLojaLink"
          >
            <PiWhatsappLogoBold size={16} aria-hidden="true" />
            WhatsApp
          </a>
          <a
            href={`https://www.instagram.com/${LOJA.instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="rodapeLojaLink"
          >
            <PiInstagramLogoBold size={16} aria-hidden="true" />
            Instagram
          </a>
          <a href="#" className="rodapeLojaLink">
            <PiArrowUpBold size={16} aria-hidden="true" />
            Voltar ao topo
          </a>
        </nav>
      </div>
    </footer>
  );
}
