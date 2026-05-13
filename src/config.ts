export const SITE = {
  url: 'https://ahmethakanergun.com',
  title: 'Ahmet Hakan Ergün',
  description:
    'Ahmet Hakan Ergün — kişisel blog.',
  author: 'Ahmet Hakan Ergün',
  locale: 'tr-TR',
  defaultOgImage: '/og-default.png',
  nav: [
    { label: 'Blog', href: '/blog' },
  ],
} as const;

export type SiteConfig = typeof SITE;
