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
    ];
  },
};

export default nextConfig;
