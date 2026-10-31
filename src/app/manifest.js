export default function manifest() {
  return {
    id: '/',
    name: 'Freelancer Discos',
    short_name: 'Freelancer - Vitrine',
    description: 'Catálogo de discos de vinil, CDs, DVDs e fitas VHS da Freelancer Discos',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Com margem maior: o Android recorta este ícone em círculo ou outros formatos.
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
