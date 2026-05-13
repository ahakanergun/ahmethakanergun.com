import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPublishedPosts } from '../utils/content';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}`,
      categories: [...post.data.tags, ...post.data.categories],
    })),
    customData: `<language>${SITE.locale}</language>`,
    trailingSlash: false,
  });
}
