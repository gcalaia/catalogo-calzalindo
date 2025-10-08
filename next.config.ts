import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // nuevo dominio HTTPS detrás de Nginx
      { protocol: 'https', hostname: 'img.calzalindo.com', pathname: '/img/**' },
      // servidor anterior (si lo seguís usando)
      { protocol: 'https', hostname: 'evirtual.calzalindo.com.ar', port: '58000', pathname: '/clz_ventas/static/images/**' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ['image/webp'],
  },
};

export default nextConfig;
