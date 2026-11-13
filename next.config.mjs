/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não anuncia a versão do framework no header x-powered-by.
  poweredByHeader: false,

  // O endereço antigo da Vercel leva para o domínio da loja, no mesmo caminho
  // (ex.: freelancer-discos-vitrine.vercel.app/lojas -> freelancerdiscos.com.br/lojas).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'freelancer-discos-vitrine.vercel.app' }],
        destination: 'https://freelancerdiscos.com.br/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede o navegador de "adivinhar" o tipo de arquivo.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Ao sair para outro site (ex.: WhatsApp), envia só o domínio, não a URL completa.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // A vitrine não usa câmera, microfone nem localização.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Outros sites não podem exibir a vitrine dentro de um quadro (clickjacking).
          // O mapa do Google na página Contato não é afetado: é a vitrine que embute o mapa.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
