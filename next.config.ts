
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* output: 'export' removed to enable Server Actions & Dynamic Intelligence */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
