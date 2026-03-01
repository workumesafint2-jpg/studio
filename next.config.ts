
import type { NextConfig } from "next";

/**
 * (ወርቁ) Pro - Next.js Configuration v3.0.8
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
  experimental: {
    // Allows the development server to trust the Cloud Workstation origin
    allowedDevOrigins: [
      '6000-firebase-studio-1770108645086.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
      '*.cloudworkstations.dev'
    ]
  }
};

export default nextConfig;
