import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
};

export default nextConfig;
