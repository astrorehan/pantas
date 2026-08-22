import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PANTAS App',
    short_name: 'PANTAS',
    description: 'Aplikasi Grading Panen AI dan Marketplace.',
    start_url: '/',
    display: 'standalone',
    // Layar percikan PWA: kanvas oat, bukan putih.
    background_color: '#f2ede3',
    // Sama dengan --field-base (light) di globals.css dan warna ubin ikon.
    theme_color: '#1a4d26',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
