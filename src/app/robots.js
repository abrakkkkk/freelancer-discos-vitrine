const SITE = 'https://freelancerdiscos.com.br';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rotas internas (validação da sacola etc.) não são páginas.
      disallow: '/api/',
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
