import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '200.58.109.125',
        port: '8080',
        pathname: '/img/**',
      },
      // Mantener el anterior por si acaso
      {
        protocol: 'https',
        hostname: 'evirtual.calzalindo.com.ar',
        port: '58000',
        pathname: '/clz_ventas/static/images/**',
      },
    ],
    // Cache de imágenes por 30 días
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Formatos optimizados
    formats: ['image/webp'],
  },
  // Variables de entorno
  env: {
    NEXT_PUBLIC_IMAGE_SERVER_URL: process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://200.58.109.125:8080/img',
  },
}

export default nextConfig
