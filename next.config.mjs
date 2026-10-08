/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/agenda',
        destination: '/admin/locacoes',
        permanent: true,
      },
      {
        source: '/admin/orcamentos',
        destination: '/admin/locacoes',
        permanent: false,
      },
      {
        source: '/admin/ia',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/admin/logs',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
