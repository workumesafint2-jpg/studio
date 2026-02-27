
import type { NextConfig } from "next";

/**
 * (ወርቁ) Pro - Next.js Configuration v3.0.3
 * 
 * CRITICAL: Do NOT use output: 'export'. 
 * The application utilizes Genkit Server Actions for AI Intelligence, 
 * which requires a dynamic server environment.
 */
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
  // Server Actions are enabled by default in Next.js 15
};

export default nextConfig;
