// Dados estruturados (schema.org em JSON-LD) para o Google entender a loja e os discos.
import { hrefDaCaixa } from '@/utils/lojas';
import { formatCaixa } from '@/utils/stringUtils';

export const SITE = 'https://freelancerdiscos.com.br';
const ORG_ID = `${SITE}/#loja`;

const FORMATO = { discos: 'Disco de vinil', cds: 'CD', dvds: 'DVD', vhs: 'Fita VHS' };

// Telefone oficial da loja, o mesmo do Perfil da Empresa no Google. Não é o WhatsApp dos
// pedidos do site (WHATSAPP_PHONE), que pode mudar por um tempo.
const telefone = '+55 85 98787-9214';

// Dados da loja física, usados também na página Contato.
export const LOJA = {
  rua: 'Rua Dr. João Moreira, 485',
  referencia: 'Próximo à Estação das Artes',
  bairroCidade: 'Centro, Fortaleza - CE',
  cep: '60030-000',
  telefoneVisivel: '(85) 98787-9214',
  whatsapp: '5585987879214',
  instagram: 'freelancer_discosalex',
  mapa: 'https://maps.google.com/?cid=5205041543162428716',
};

export function dadosDoSite() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // Loja física: os mesmos dados do Perfil da Empresa no Google. Loja 1, Loja 2 e o
        // Anexo ficam lado a lado, no mesmo endereço.
        '@type': ['MusicStore', 'Organization'],
        '@id': ORG_ID,
        name: 'Freelancer Discos',
        url: SITE,
        logo: `${SITE}/logo.jpg`,
        image: `${SITE}/og.png`,
        description: 'Discos de vinil, CDs, DVDs e fitas VHS nas lojas 1 e 2, no Centro de Fortaleza.',
        telephone: telefone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rua Dr. João Moreira, 485 - próximo à Estação das Artes',
          addressLocality: 'Fortaleza',
          addressRegion: 'CE',
          postalCode: '60030-000',
          addressCountry: 'BR',
        },
        hasMap: LOJA.mapa,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '17:00',
          },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '15:00' },
        ],
        sameAs: [`https://www.instagram.com/${LOJA.instagram}/`],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: telefone,
          contactType: 'sales',
          availableLanguage: 'pt-BR',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#site`,
        name: 'Freelancer Discos — Discos de vinil, CDs e DVDs',
        url: SITE,
        inLanguage: 'pt-BR',
        publisher: { '@id': ORG_ID },
        // Busca do catálogo: /?busca=termo
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/?busca={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** Trilha de navegação: lista de [nome, caminho]. */
export function trilha(passos) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: passos.map(([nome, caminho], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: nome,
      item: `${SITE}${caminho}`,
    })),
  };
}

const SLUG_LOJA = { 'Loja 1': 'loja-1', 'Loja 2': 'loja-2' };

export function trilhaDaCaixa(nomeLoja, caixa) {
  const passos = [
    ['Início', '/'],
    ['Caixas', '/lojas'],
  ];
  if (SLUG_LOJA[nomeLoja]) passos.push([nomeLoja, `/lojas/${SLUG_LOJA[nomeLoja]}`]);
  const href = hrefDaCaixa(nomeLoja, caixa);
  if (href) passos.push([formatCaixa(caixa, nomeLoja), href]);
  return passos;
}

export function dadosDoDisco(item, categoria) {
  const caminho = `/disco/${categoria}/${item.id}`;
  const nome = item.artista ? `${item.artista} · ${item.titulo}` : item.titulo;
  const preco = Number(item.preco);
  const produto = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nome,
    sku: `${categoria}-${item.id}`,
    category: FORMATO[categoria] || 'Disco',
    url: `${SITE}${caminho}`,
    description: [FORMATO[categoria], item.ano, item.observacao].filter(Boolean).join(' · ') || nome,
  };
  if (item.capa_url) produto.image = item.capa_url;
  if (item.artista) produto.brand = { '@type': 'Brand', name: item.artista };
  if (preco > 0) {
    produto.offers = {
      '@type': 'Offer',
      price: preco.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${SITE}${caminho}`,
      seller: { '@id': ORG_ID, '@type': 'Organization', name: 'Freelancer Discos' },
    };
  }
  const passos = [...trilhaDaCaixa(item.loja, item.caixa), [nome, caminho]];
  return [produto, trilha(passos)];
}

/** Escreve o JSON-LD na página. O "<" vira < para o texto nunca fechar o script. */
export function JsonLd({ dados }) {
  const lista = Array.isArray(dados) ? dados : [dados];
  return lista.map((d, i) => (
    <script
      key={i}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\u003c') }}
    />
  ));
}
