import { FaWhatsapp } from 'react-icons/fa';
import { FiTruck } from 'react-icons/fi';
import { WHATSAPP_PHONE } from '@/utils/cartUtils';

// Faixa vermelha no topo de todas as páginas (vem do layout). No celular a frase do WhatsApp encurta.
export default function FaixaServico() {
  return (
    <div className="vlFaixa">
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
