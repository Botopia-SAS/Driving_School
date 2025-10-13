import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serverExternalPackages: ["stripe"], // Stripe eliminado
  images: {
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
      {
        protocol: "https",
        hostname: "cdn.auth0.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)", // Aplica a todas las rutas
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Permite que el sitio se cargue en un iframe
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://driving-school-mocha.vercel.app https://dashboard-ds-flax.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

