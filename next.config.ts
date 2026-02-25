
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: [
      "https://*.cloudworkstations.dev",
      "https://*.vercel.app",
      "http://localhost:9002"
    ],
  },
};

export default nextConfig;
