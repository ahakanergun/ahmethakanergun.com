// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { readFileSync } from 'node:fs';

/** @type {Record<string, string>} */
let legacyRedirects = {};
try {
  legacyRedirects = JSON.parse(
    readFileSync(new URL('./data/legacy-redirects.json', import.meta.url), 'utf8')
  );
} catch {}

const legacyPaths = new Set(
  Object.keys(legacyRedirects).map((p) => p.replace(/\/$/, ''))
);

export default defineConfig({
  site: 'https://ahmethakanergun.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  redirects: legacyRedirects,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        try {
          const p = new URL(page).pathname.replace(/\/$/, '');
          if (legacyPaths.has(p)) return false;
          // /gezi/* kişisel sayfalar — sitemap'e girmesin (noindex + robots.txt ile birlikte)
          if (p === '/gezi' || p.startsWith('/gezi/')) return false;
          return true;
        } catch {
          return true;
        }
      },
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://ahmethakanergun.com/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/blog/')) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        if (item.url.endsWith('/blog')) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.6 };
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
      wrap: true,
    },
  },
});
