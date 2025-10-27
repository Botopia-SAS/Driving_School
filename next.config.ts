import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    qualities: [75, 85, 90, 95], // Calidades permitidas
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
    ],
  },

  // Compresión habilitada
  compress: true,

  // Remover header de Next.js
  poweredByHeader: false,

  // Headers optimizados para performance y seguridad
  async headers() {
    return [
      // Cache para assets estáticos
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache para archivos de Next.js
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Headers de seguridad para todas las rutas
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://driving-school-mocha.vercel.app https://dashboard-ds-flax.vercel.app",
          },
        ],
      },
    ];
  },

  // Experimental: Optimización de paquetes
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },
};

export default nextConfig;

