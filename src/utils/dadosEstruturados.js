// Dados estruturados (schema.org em JSON-LD) para o Google entender a loja e os discos.
import { WHATSAPP_PHONE } from '@/utils/cartUtils';
import { hrefDaCaixa } from '@/utils/lojas';
import { formatCaixa } from '@/utils/stringUtils';

export const SITE = 'https://freelancerdiscos.com.br';
const ORG_ID = `${SITE}/#loja`;

const FORMATO = { discos: 'Disco de vinil', cds: 'CD', dvds: 'DVD', vhs: 'Fita VHS' };

// "5585988817621" -> "+55 85 98881-7621"
const telefone = WHATSAPP_PHONE.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 $2 $3-$4');

export function dadosDoSite() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'Freelancer Discos',
        url: SITE,
        logo: `${SITE}/logo.jpg`,
        image: `${SITE}/og.png`,
        description: 'Discos de vinil, CDs, DVDs e fitas VHS nas lojas 1 e 2.',
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
        name: 'Freelancer Discos — Vitrine do Estoque',
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
