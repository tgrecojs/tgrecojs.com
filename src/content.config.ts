import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// `post.id` is the filename without extension and becomes the URL: /posts/<id>.
//
// `source` says where a post was first published. Posts mirrored from
// hindleymilner.com are written by scripts/mirror-hm.mjs, carry
// `source: hindleymilner` and a `canonical` URL, and should not be edited here.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    source: z.enum(['here', 'hindleymilner']).default('here'),
    canonical: z.string().url().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    minutesRead: z.number().optional(),
    // Path under /public to a self-contained Colorfigures page, e.g. /figures/telescope.html
    figure: z.string().optional(),
  }),
});

export const collections = { posts };
