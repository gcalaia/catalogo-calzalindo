import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Permitir imágenes desde el proxy local
      {
        protocol: 'https',
        hostname: 'catalogo-calzalindo.vercel.app',
        pathname: '/proxy/imagen/**'
      },
      // Servidor de imágenes en VPS con IP directa
      {
        protocol: 'http',
        hostname: '200.58.109.125',
        port: '8080',
        pathname: '/img/**'
      },
      // NUEVO: API de imágenes
      {
        protocol: 'http',
        hostname: '200.58.109.125',
        port: '8007',
        pathname: '/imagenes/**'
      },
      // Servidor anterior (fallback)
      {
        protocol: 'https',
        hostname: 'evirtual.calzalindo.com.ar',
        port: '58000',
        pathname: '/clz_ventas/static/images/**'
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ['image/webp'],
  },
  async rewrites() {
    return [
      // Proxy para la API de consulta
      {
        source: '/api/imagen/:codigo',
        destination: 'http://200.58.109.125:8007/api/imagen/:codigo',
      },
      // NUEVO: Proxy para servir las imágenes también
      {
        source: '/proxy/imagen/:year/:month/:day/:filename',
        destination: 'http://200.58.109.125:8007/imagenes/:year/:month/:day/:filename',
      },
    ];
  },
};

export default nextConfig;
