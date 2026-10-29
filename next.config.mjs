/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não anuncia a versão do framework no header x-powered-by.
  poweredByHeader: false,

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
        ],
      },
    ];
  },
};

export default nextConfig;
