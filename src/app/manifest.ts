
/**
 * @fileOverview Manifest.ts is deprecated in v3.0.0 in favor of public/manifest.json
 * to resolve Vercel static export "failed to collect page data" errors.
 */
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {};
}
