# ahmethakanergun.com

Kişisel blog. Statik Astro sitesi, brutalist tipografi, içerik Markdown'da.
GitHub Pages üzerinde servis edilir.

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → dist/
npm run preview   # serve dist/
```

## WordPress içeriğini içe aktarma

WordPress admin paneli → Tools → Export → All content → XML indir.

```bash
npm run import:wp -- /path/to/wordpress-export.xml
# Test çalıştırması (dosya yazmaz):
npm run import:wp -- /path/to/wordpress-export.xml --dry
# Görsel indirmeden:
npm run import:wp -- /path/to/wordpress-export.xml --no-images
```

Importer ne yapar:

- `publish` postları yayın olarak yazar
- `draft`, `pending`, `private` → `draft: true` frontmatter
- `trash`, `inherit`, `auto-draft` → atlar
- `<img>` URL'lerini indirip `src/assets/wp/<slug>/` altına yerleştirir
- Markdown'ı `src/content/blog/<slug>.md` olarak yazar
- Eski WordPress permalink'lerini `data/legacy-redirects.json`'a kaydeder
  (build sırasında redirect HTML'leri üretilir)

## Yeni yazı ekleme

`src/content/blog/yeni-yazi.md`:

```yaml
---
title: "Yazı başlığı"
description: "Tek satır SEO açıklaması"
pubDate: 2026-05-11
draft: false
tags: [yazılım, not]
---

Yazı içeriği burada...
```

`draft: true` ise dev'de görünür, production build'de hiç render edilmez.
İleri tarihli `pubDate` da production'da gizlenir.

## Deploy

GitHub'a push edildiğinde `.github/workflows/deploy.yml` otomatik çalışır:

1. `npm ci` ile bağımlılıklar
2. `npm run build` ile dist/ üretimi
3. GitHub Pages'e upload

### İlk kurulum

1. Yeni bir GitHub reposu aç (örn: `ahmethakanergun/ahmethakanergun.com`)
2. Repo Settings → Pages → Source: **GitHub Actions**
3. Repo Settings → Pages → Custom domain: `ahmethakanergun.com`
4. DNS sağlayıcında (DirectAdmin / Cloudflare / nerede yönetiyorsan):
   - **A** kaydı `@` → `185.199.108.153`
   - **A** kaydı `@` → `185.199.109.153`
   - **A** kaydı `@` → `185.199.110.153`
   - **A** kaydı `@` → `185.199.111.153`
   - **CNAME** kaydı `www` → `<github-username>.github.io.`
5. Pages settings'te **Enforce HTTPS** açık olsun.

`public/CNAME` dosyası zaten `ahmethakanergun.com` içeriğinde — GitHub Pages bunu otomatik okur.

## Mimari

```
src/
├── config.ts                 # site metadata (title, social, nav)
├── content.config.ts         # blog collection schema (Zod)
├── content/blog/             # Markdown yazılar
├── assets/wp/                # WordPress'ten indirilen görseller
├── layouts/BaseLayout.astro  # tüm sayfaların kabuğu (head, header, footer)
├── components/               # Head, Header, Footer
├── pages/
│   ├── index.astro           # ana sayfa (bio + son yazılar)
│   ├── about.astro
│   ├── 404.astro
│   ├── rss.xml.ts            # /rss.xml
│   └── blog/
│       ├── index.astro       # /blog (yıllara göre arşiv)
│       └── [...slug].astro   # /blog/<slug> (yazı sayfası)
├── styles/global.css         # brutalist design tokens + base styles
└── utils/content.ts          # getPublishedPosts (draft + future filter)
```

## SEO checklist

- [x] `<title>` + `<meta description>` her sayfada
- [x] Open Graph + Twitter card tags
- [x] Canonical URL
- [x] JSON-LD: Person + WebSite (global), BlogPosting + BreadcrumbList (yazı)
- [x] `sitemap-index.xml` (draft hariç)
- [x] `robots.txt`
- [x] `/rss.xml`
- [x] Semantic HTML (`<article>`, `<time>`, `<nav>`)
- [x] WordPress legacy URL → yeni URL redirect (link equity korunur)
- [x] `lang="tr"` + `og:locale`

## Tasarım notları

- Renk: kağıt (`--paper`) + mürekkep (`--ink`) + sinyal (`--signal: #ff3b00`)
- Tipografi: display için system black face, gövde mono, makale içi serif
- Hard borders, gölge yok, radius yok
- Dark mode `prefers-color-scheme` ile otomatik
