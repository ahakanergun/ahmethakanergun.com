export const SITE = {
  url: 'https://ahmethakanergun.com',
  title: 'Ahmet Hakan Ergün',
  description:
    'Ahmet Hakan Ergün — Frontend Developer ve Software Engineer. Yazılım, tasarım ve teknoloji üzerine kişisel blog.',
  author: 'Ahmet Hakan Ergün',
  jobTitle: 'Frontend Developer',
  knowsAbout: [
    'Frontend Development',
    'Yazılım Geliştirme',
    'Software Engineering',
    'Web Development',
    'React',
    'TypeScript',
    'JavaScript',
    'CSS',
    'UI / UX Tasarımı',
    'Astro',
  ],
  keywords:
    'Ahmet Hakan Ergün, frontend developer, yazılım developer, software engineer, yazılım mühendisi, kişisel blog, yazılım blogu, frontend blog, web geliştirme, react, typescript',
  locale: 'tr-TR',
  defaultOgImage: '/og-default.png',
  nav: [
    { label: 'Blog', href: '/blog' },
  ],
} as const;

export type SiteConfig = typeof SITE;
