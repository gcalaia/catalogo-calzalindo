import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'evirtual.calzalindo.com.ar',
        port: '58000',
        pathname: '/clz_ventas/static/images/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**', // Permite cualquier otra URL (útil para desarrollo)
      },
    ],
  },
};

export default nextConfig;