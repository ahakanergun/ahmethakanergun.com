import { getCollection, type CollectionEntry } from 'astro:content';

type BlogEntry = CollectionEntry<'blog'>;

const PROD = import.meta.env.PROD;

export async function getPublishedPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog', ({ data }) => {
    if (data.draft) return false;
    if (PROD && data.pubDate.getTime() > Date.now()) return false;
    return true;
  });
  return posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}

export function formatDate(
  date: Date,
  locale = 'tr-TR'
): { iso: string; display: string } {
  return {
    iso: date.toISOString(),
    display: new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date),
  };
}

export function readingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}
