export const SITE = {
  url: 'https://ahmethakanergun.com',
  title: 'Ahmet Hakan Ergün',
  tagline: 'Notlar, denemeler, üretim.',
  description:
    'Ahmet Hakan Ergün — kişisel blog. Yazılım, tasarım ve üretim üzerine notlar ve denemeler.',
  author: 'Ahmet Hakan Ergün',
  locale: 'tr-TR',
  defaultOgImage: '/og-default.png',
  nav: [
    { label: 'Blog', href: '/blog' },
  ],
} as const;

export type SiteConfig = typeof SITE;
