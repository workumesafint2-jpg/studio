
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // Crucial for static export file paths in Electron
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Fix for the dev origin warning in cloud environments like Firebase Studio
  experimental: {
    allowedDevOrigins: [
      'localhost:9002', 
      '0.0.0.0:9002', 
      '*.cloudworkstations.dev', 
      '*.cluster-*.cloudworkstations.dev',
      '*.vercel.app'
    ]
  }
};

export default nextConfig;
