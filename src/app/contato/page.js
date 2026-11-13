import {
  PiArrowUpRightBold,
  PiInstagramLogoBold,
  PiMapPinBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { BarraEditorial, NavDesktopEditorial } from '@/editorial/NavEditorial';
import { compartilhamento } from '@/utils/seo';
import { dadosDoSite, JsonLd, LOJA, trilha } from '@/utils/dadosEstruturados';

export const metadata = {
  title: 'Contato',
  alternates: { canonical: '/contato' },
  ...compartilhamento({
    titulo: 'Contato · Freelancer Discos',
    descricao: `${LOJA.rua}, ${LOJA.referencia.toLowerCase()}, Fortaleza. WhatsApp ${LOJA.telefoneVisivel} e Instagram @${LOJA.instagram}.`,
    caminho: '/contato',
  }),
};

// O mapa embutido do Google não pede chave: a busca pelo nome e endereço marca a loja.
const MAPA_EMBUTIDO = `https://maps.google.com/maps?q=${encodeURIComponent(
  `Freelancer Discos, ${LOJA.rua}, Fortaleza - CE`,
)}&z=17&output=embed`;

const HORARIOS = [
  ['Segunda a sexta', '9h às 17h'],
  ['Sábado', '9h às 15h'],
];

export default function ContatoPage() {
  return (
    <div className="pageContainer">
      <JsonLd dados={[dadosDoSite(), trilha([['Início', '/'], ['Contato', '/contato']])]} />
      <header className="storeHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <img src="/logo.png" alt="" className="headerLogo" />
          <div style={{ minWidth: 0 }}>
            <h1 className="headerTitle">Contato</h1>
            <p className="headerSubtitle">Loja, WhatsApp e Instagram</p>
          </div>
        </div>
        <NavDesktopEditorial />
      </header>

      <div className="edContato">
        <div className="edContatoInfo">
          {/* Endereço: a rua em destaque, o resto em uma linha só. */}
          <section className="edContatoBloco" aria-labelledby="contato-endereco">
            <h2 id="contato-endereco" className="edContatoRotulo">Endereço</h2>
            <p className="edContatoValor">{LOJA.rua}</p>
            <p className="edContatoNota">
              {LOJA.referencia} · {LOJA.bairroCidade} · {LOJA.cep}
            </p>
            <p className="edContatoNota">Loja 1, Loja 2 e o Anexo ficam lado a lado.</p>
            <a href={LOJA.mapa} target="_blank" rel="noopener noreferrer" className="edContatoLink">
              <PiMapPinBold size={18} aria-hidden="true" />
              Abrir no Google Maps
              <PiArrowUpRightBold size={14} aria-hidden="true" />
            </a>
          </section>

          <section className="edContatoBloco" aria-labelledby="contato-horario">
            <h2 id="contato-horario" className="edContatoRotulo">Horário</h2>
            <dl className="edContatoHorarios tabularNums">
              {HORARIOS.map(([dias, horas]) => (
                <div key={dias}>
                  <dt>{dias}</dt>
                  <dd>{horas}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="edContatoBloco" aria-labelledby="contato-whatsapp">
            <h2 id="contato-whatsapp" className="edContatoRotulo">WhatsApp</h2>
            <p className="edContatoValor tabularNums">{LOJA.telefoneVisivel}</p>
            <a
              href={`https://wa.me/${LOJA.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="edContatoLink"
            >
              <PiWhatsappLogoBold size={18} aria-hidden="true" />
              Conversar no WhatsApp
              <PiArrowUpRightBold size={14} aria-hidden="true" />
            </a>
          </section>

          <section className="edContatoBloco" aria-labelledby="contato-instagram">
            <h2 id="contato-instagram" className="edContatoRotulo">Instagram</h2>
            <p className="edContatoValor">@{LOJA.instagram}</p>
            <a
              href={`https://www.instagram.com/${LOJA.instagram}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="edContatoLink"
            >
              <PiInstagramLogoBold size={18} aria-hidden="true" />
              Ver o perfil
              <PiArrowUpRightBold size={14} aria-hidden="true" />
            </a>
          </section>
        </div>

        <div className="edContatoMapa">
          <iframe
            src={MAPA_EMBUTIDO}
            title={`Mapa: Freelancer Discos, ${LOJA.rua}, Fortaleza`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <BarraEditorial />
    </div>
  );
}
