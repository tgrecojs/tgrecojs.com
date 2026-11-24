import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { nightSkyLight, nightSkyDark } from './src/styles/shiki-night-sky.mjs';

// Vercel deploys api/likes.ts as a function, but `astro dev` knows nothing about the api/
// folder. This plugin answers /api/likes in dev by running that same file, so the like
// button works locally. The store's credentials come from .env.local (`vercel env pull`).
const likesInDev = {
  name: 'likes-in-dev',
  apply: 'serve',
  configureServer(server) {
    try {
      process.loadEnvFile('.env.local');
    } catch {
      // No credentials pulled: the function answers 503 and the like button stays hidden.
    }
    server.middlewares.use('/api/likes', async (req, res) => {
      const { default: likes } = await import('./api/likes.ts');
      const response = await likes.fetch(
        new Request(new URL(req.originalUrl, 'http://localhost'), {
          method: req.method,
          headers: { 'x-forwarded-for': req.socket.remoteAddress ?? '' },
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    });
  },
};

export default defineConfig({
  site: 'https://tgrecojs.com',
  trailingSlash: 'never',
  vite: { plugins: [likesInDev] },
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
