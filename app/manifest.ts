import type { MetadataRoute } from 'next';
import { BRAND } from '../lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.title,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'bn',
    dir: 'ltr',
    background_color: '#064e3b',
    theme_color: '#064e3b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
