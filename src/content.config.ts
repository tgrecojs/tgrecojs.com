import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// `post.id` is the filename without extension and becomes the URL: /posts/<id>.
//
// This site is the source of truth for every post. Set `crosspost: hindleymilner` on
// engineering posts to have hm-blog's `npm run mirror` copy them to
// blog.hindleymilner.com (published posts only, with a canonical link back here).
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    crosspost: z.literal('hindleymilner').optional(),
    canonical: z.string().url().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    minutesRead: z.number().optional(),
    // Path under /public to a self-contained Colorfigures page, e.g. /figures/telescope.html
    figure: z.string().optional(),
    // The id the post was first published under. Comments and likes are stored under it,
    // so set it to the old id when you rename a post and they follow the post.
    originalId: z.string().optional(),
  }),
});

export const collections = { posts };
