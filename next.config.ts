
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
  // Removed experimental.allowedDevOrigins to resolve "Unrecognized key" warnings in Next.js 15.5.9
};

export default nextConfig;
