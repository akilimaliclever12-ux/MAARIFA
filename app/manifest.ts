import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Web App Manifest — makes Maarifa installable ("Add to Home screen" / Install).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maarifa — Archives Académiques du Sud-Kivu',
    short_name: 'Maarifa',
    description:
      'Publiez, découvrez et partagez les travaux académiques de Bukavu et du Sud-Kivu.',
    start_url: '/fr',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'fr',
    background_color: '#F4F6F8',
    theme_color: '#0F4C81',
    icons: [
      { src: '/maarifa_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/maarifa_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
