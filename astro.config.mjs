import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { nightSkyLight, nightSkyDark } from './src/styles/shiki-night-sky.mjs';

export default defineConfig({
  site: 'https://tgrecojs.com',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
    }),
    shikiConfig: {
      // Dual themes: Shiki emits --shiki-light / --shiki-dark variables and
      // global.css switches between them with the rest of the palette.
      themes: { light: nightSkyLight, dark: nightSkyDark },
      defaultColor: false,
      wrap: true,
    },
  },
});
