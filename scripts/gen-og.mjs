#!/usr/bin/env node
/**
 * 1200x630 og:default.png üretir (kişisel site genel paylaşım kartı).
 * Sharp ile SVG → PNG. Sistem fontu fallback (sharp Fraunces yüklemiyor).
 *
 *   npm run gen:og
 */

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const OUT = join(ROOT, 'public', 'og-default.png');

const W = 1200, H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fcfbf7"/>
      <stop offset="100%" stop-color="#f3f1ea"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- accent line top-left -->
  <line x1="80" y1="80" x2="160" y2="80" stroke="#a3522c" stroke-width="3"/>

  <!-- eyebrow -->
  <text x="80" y="115" font-family="Georgia, 'Iowan Old Style', serif" font-style="italic" font-size="22" fill="#7c7882">Kişisel kayıt</text>

  <!-- name -->
  <text x="80" y="280" font-family="Georgia, 'Iowan Old Style', serif" font-size="120" font-weight="500" fill="#18171a" letter-spacing="-4">Ahmet Hakan</text>
  <text x="80" y="410" font-family="Georgia, 'Iowan Old Style', serif" font-size="120" font-weight="400" font-style="italic" fill="#a3522c" letter-spacing="-4">Ergün</text>

  <!-- tagline -->
  <text x="80" y="495" font-family="Georgia, 'Iowan Old Style', serif" font-style="italic" font-size="34" fill="#2b292d">Notlar, denemeler, üretim.</text>

  <!-- url -->
  <text x="80" y="570" font-family="Georgia, 'Iowan Old Style', serif" font-size="24" fill="#7c7882">ahmethakanergun.com</text>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`Wrote ${OUT}`);
