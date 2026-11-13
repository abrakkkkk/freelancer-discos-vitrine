// Metadados de compartilhamento (WhatsApp, Instagram, Facebook, X).
// O Next junta os metadados das páginas de forma rasa: quem declara openGraph substitui o do
// layout inteiro. Por isso cada página monta o seu por aqui, com todos os campos.
export const SITE_NOME = 'Freelancer Discos';
export const DESCRICAO_PADRAO =
  'Vitrine do estoque da Freelancer Discos: discos de vinil, CDs, DVDs e fitas VHS nas lojas 1 e 2. Monte a sacola e peça pelo WhatsApp.';
const IMAGEM_PADRAO = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Freelancer Discos · Vitrine do estoque',
};

export function compartilhamento({ titulo, descricao = DESCRICAO_PADRAO, caminho = '/', imagem = null }) {
  const imagens = [imagem || IMAGEM_PADRAO];
  return {
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: SITE_NOME,
      title: titulo,
      description: descricao,
      url: caminho,
      images: imagens,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: imagens.map((i) => i.url),
    },
  };
}
