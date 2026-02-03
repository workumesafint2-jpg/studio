import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '(ወርቁ)',
    short_name: 'ወርቁ',
    description: 'Smart BPMN Generator',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a365d',
    icons: [
      {
        src: 'https://picsum.photos/seed/pwa/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/pwa/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}