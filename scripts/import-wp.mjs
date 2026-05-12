#!/usr/bin/env node
/**
 * WordPress WXR (XML) → Astro Markdown importer.
 *
 * Usage:
 *   npm run import:wp -- path/to/wordpress.xml
 *
 * Behaviour:
 *   - Reads WXR export (any WP version).
 *   - For each <item> with post_type=post:
 *       publish      → published Markdown
 *       draft        → frontmatter draft: true
 *       pending      → frontmatter draft: true
 *       private      → frontmatter draft: true
 *       future       → published Markdown (pubDate is future, filtered at build)
 *       trash        → skipped
 *       inherit      → skipped (revisions)
 *   - Pages and attachments are skipped (pages can be authored by hand).
 *   - HTML content is converted to Markdown via turndown + GFM.
 *   - <img> URLs are downloaded into src/assets/wp/<slug>/<filename> and
 *     rewritten to relative paths so Astro can optimise them.
 *   - Legacy permalinks (from <link>) are recorded in data/legacy-redirects.json
 *     so astro.config.mjs can emit static redirects to the new /blog/<slug> URL.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import slugifyMod from 'slugify';

const slugify = slugifyMod.default ?? slugifyMod;
const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const args = process.argv.slice(2);
const xmlArg = args.find((a) => !a.startsWith('--'));
const DOWNLOAD_IMAGES = !args.includes('--no-images');
const DRY = args.includes('--dry');

if (!xmlArg) {
  console.error(
    'Usage: npm run import:wp -- <path-to-wordpress-export.xml> [--no-images] [--dry]'
  );
  process.exit(1);
}

const xmlPath = resolve(xmlArg);
if (!existsSync(xmlPath)) {
  console.error(`File not found: ${xmlPath}`);
  process.exit(1);
}

const outDir = join(ROOT, 'src', 'content', 'blog');
const assetsDir = join(ROOT, 'src', 'assets', 'wp');
const redirectsPath = join(ROOT, 'data', 'legacy-redirects.json');

const DRAFT_STATUSES = new Set(['draft', 'pending', 'private']);
const SKIP_STATUSES = new Set(['trash', 'inherit', 'auto-draft']);

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});
turndown.use(gfm);

// Preserve <figure>/<figcaption> as Markdown image with caption underneath.
turndown.addRule('figure', {
  filter: 'figure',
  replacement: (_, node) => {
    const img = node.querySelector?.('img');
    const cap = node.querySelector?.('figcaption');
    if (!img) return '';
    const src = img.getAttribute('src') || '';
    const alt = (img.getAttribute('alt') || '').replace(/\n/g, ' ');
    const caption = cap?.textContent?.trim() ?? '';
    const md = `![${alt}](${src})`;
    return caption ? `${md}\n\n*${caption}*\n` : md;
  },
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  parseTagValue: false,
  trimValues: true,
  textNodeName: '#text',
});

async function readXML() {
  const buf = await readFile(xmlPath, 'utf8');
  return parser.parse(buf);
}

function cdata(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if ('__cdata' in value) return String(value.__cdata ?? '');
    if ('#text' in value) return String(value['#text'] ?? '');
  }
  return String(value);
}

function arr(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function yamlEscape(str) {
  const s = String(str);
  if (s === '') return '""';
  // Quote if any YAML indicator or flow char is present, or if the string
  // starts/ends with whitespace, dash, question mark, or quote.
  const needsQuote =
    /[:#&*!|>%@`"',\[\]{}<\n\r\t\\]/.test(s) ||
    /^[\s\-?]/.test(s) ||
    /\s$/.test(s);
  if (needsQuote) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function yamlList(items) {
  const clean = items
    .map((x) => String(x).trim())
    .filter(Boolean)
    .map(yamlEscape);
  if (clean.length === 0) return '[]';
  return `[${clean.join(', ')}]`;
}

function pickSlug(item) {
  const raw = cdata(item['wp:post_name']);
  const fallback = cdata(item.title);
  const candidate = raw || fallback || 'untitled';
  return slugify(candidate, { lower: true, strict: true, locale: 'tr' });
}

function pickPubDate(item) {
  const pub = cdata(item.pubDate);
  const wpDate = cdata(item['wp:post_date_gmt']);
  const fallback = cdata(item['wp:post_date']);
  const str = (wpDate && wpDate !== '0000-00-00 00:00:00' && wpDate) || pub || fallback;
  const d = new Date(str.includes('GMT') || str.includes('Z') ? str : str + ' UTC');
  return Number.isNaN(d.valueOf()) ? new Date() : d;
}

function pickDescription(item, body) {
  const excerpt = cdata(item['excerpt:encoded']);
  if (excerpt) {
    return stripHtml(excerpt).slice(0, 240);
  }
  const text = stripHtml(body).replace(/\s+/g, ' ').trim();
  return text.slice(0, 220);
}

function stripHtml(s) {
  return String(s)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function pickTaxonomy(item) {
  const cats = arr(item.category);
  const tags = [];
  const categories = [];
  for (const c of cats) {
    if (!c) continue;
    const domain = c['@_domain'];
    const name = cdata(c['#text'] ?? c).trim();
    if (!name) continue;
    if (domain === 'post_tag') tags.push(name);
    else if (domain === 'category' && name.toLowerCase() !== 'uncategorized') {
      categories.push(name);
    }
  }
  return { tags: [...new Set(tags)], categories: [...new Set(categories)] };
}

function legacyPathOf(item) {
  const link = cdata(item.link);
  try {
    const u = new URL(link);
    let p = u.pathname.replace(/\/+$/, '');
    return p || null;
  } catch {
    return null;
  }
}

async function downloadImage(url, destDir) {
  try {
    const u = new URL(url);
    const filename = decodeURIComponent(u.pathname.split('/').pop() || 'image');
    if (!filename || !extname(filename)) return null;
    await mkdir(destDir, { recursive: true });
    const dest = join(destDir, filename);
    if (existsSync(dest)) return filename;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ↳ image fetch failed (${res.status}): ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    return filename;
  } catch (e) {
    console.warn(`  ↳ image error: ${url} (${e.message})`);
    return null;
  }
}

async function processImages(markdown, slug) {
  if (!DOWNLOAD_IMAGES || DRY) return { md: markdown, hero: null };
  const destDir = join(assetsDir, slug);
  const re = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  let hero = null;
  const replacements = [];
  while ((m = re.exec(markdown)) !== null) {
    replacements.push({ alt: m[1], url: m[2], full: m[0] });
  }
  let result = markdown;
  for (const r of replacements) {
    const fname = await downloadImage(r.url, destDir);
    if (fname) {
      const rel = `../../assets/wp/${slug}/${fname}`;
      result = result.replace(r.full, `![${r.alt}](${rel})`);
      if (!hero) hero = rel;
    }
  }
  return { md: result, hero };
}

function frontmatter(data) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: ${yamlList(v)}`);
    } else if (v instanceof Date) {
      lines.push(`${k}: ${v.toISOString()}`);
    } else if (typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${yamlEscape(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

async function main() {
  console.log(`\n→ Reading WXR: ${xmlPath}`);
  const data = await readXML();

  const items = arr(data?.rss?.channel?.item);
  console.log(`  Found ${items.length} item(s) in feed.`);

  const redirects = {};
  const usedSlugs = new Set();
  let written = 0;
  let drafts = 0;
  let skipped = 0;

  if (!DRY) {
    await mkdir(outDir, { recursive: true });
  }

  function uniqueSlug(base) {
    let s = base;
    let i = 2;
    while (usedSlugs.has(s)) {
      s = `${base}-${i++}`;
    }
    usedSlugs.add(s);
    return s;
  }

  for (const item of items) {
    const postType = cdata(item['wp:post_type']);
    if (postType !== 'post') {
      skipped++;
      continue;
    }
    const status = cdata(item['wp:status']);
    if (SKIP_STATUSES.has(status)) {
      skipped++;
      continue;
    }

    const title = cdata(item.title) || 'Untitled';
    const slug = uniqueSlug(pickSlug(item));
    const pubDate = pickPubDate(item);
    const rawHtml = cdata(item['content:encoded']);
    let markdown = turndown.turndown(rawHtml || '');
    const { md: processed, hero } = await processImages(markdown, slug);
    markdown = processed;
    const description = pickDescription(item, rawHtml);
    const { tags, categories } = pickTaxonomy(item);
    const isDraft = DRAFT_STATUSES.has(status);
    if (isDraft) drafts++;

    const legacyPath = legacyPathOf(item);
    const newPath = `/blog/${slug}`;
    if (legacyPath && legacyPath !== newPath) {
      redirects[legacyPath] = newPath;
    }

    const fm = frontmatter({
      title,
      description: description || title,
      pubDate,
      draft: isDraft || undefined,
      tags,
      categories,
      heroImage: hero ?? undefined,
      legacyURL: legacyPath ?? undefined,
    });

    const filename = `${slug}.md`;
    const filepath = join(outDir, filename);

    if (DRY) {
      console.log(`  [dry] ${status.padEnd(7)} ${slug}`);
    } else {
      await writeFile(filepath, fm + markdown.trim() + '\n', 'utf8');
      console.log(`  ✓ ${status.padEnd(7)} ${slug}`);
    }
    written++;
  }

  if (!DRY) {
    const existing = existsSync(redirectsPath)
      ? JSON.parse(await readFile(redirectsPath, 'utf8'))
      : {};
    const merged = { ...existing, ...redirects };
    await writeFile(
      redirectsPath,
      JSON.stringify(merged, null, 2) + '\n',
      'utf8'
    );
  }

  console.log(`\nDone.`);
  console.log(`  Written:  ${written}`);
  console.log(`  Drafts:   ${drafts}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Redirects: ${Object.keys(redirects).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
