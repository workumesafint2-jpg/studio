
import type { NextConfig } from "next";

/**
 * (ወርቁ) Pro - Next.js Configuration v3.0.5
 * 
 * CRITICAL: Do NOT use output: 'export'. 
 * The application utilizes Genkit Server Actions for AI Intelligence, 
 * which requires a dynamic server environment (Node.js runtime).
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
  // Dynamic runtime is required for Genkit and Server Actions
};

export default nextConfig;
