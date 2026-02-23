/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ለ Vercel ግንባታ አስፈላጊ ነው
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'worku-mesafint.vercel.app' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'localhost:9002',
      '*.cloudworkstations.dev',
      '*.vercel.app',
      'worku-mesafint.vercel.app'
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
};

export default nextConfig;
