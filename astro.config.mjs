import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tgrecojs.com',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      // Dual themes: Shiki emits --shiki-light / --shiki-dark variables and
      // global.css switches between them with the rest of the palette.
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});
