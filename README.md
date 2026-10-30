# tgrecojs.com

Thomas Greco's personal site. Astro, static output, deployed on Vercel.

Posts are MDX files in `src/content/posts`. Posts from the Hindley Milner blog are mirrored
in by a script; posts written here are written here.

## Commands

| Command                         | What it does                                          |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | Dev server at localhost:4321 (drafts visible)         |
| `npm run build`                 | Typecheck and build to `dist/` (drafts excluded)      |
| `npm run preview`               | Serve `dist/` locally                                 |
| `npm run mirror`                | Copy posts from `../hm-blog` into `src/content/posts` |
| `npm run new-post -- --title X` | Scaffold a draft post                                 |

## Writing a post

```bash
npm run new-post -- --title "What I saw tonight" --tags telescope,sky
```

Fill in `description`, write, set `draft: false` when it is ready. Frontmatter fields are
listed in `src/content.config.ts`.

To embed a Colorfigures figure, drop its self-contained HTML in `public/figures/` and add
`figure: /figures/name.html` to the frontmatter. It renders above the post body in an
iframe, with a link to open it full screen.

## Mirroring Hindley Milner posts

```bash
npm run mirror
```

Reads every post in `../hm-blog/src/content/blog`, adds `source: hindleymilner`,
and writes it to `src/content/posts/<same-id>.mdx`.
Mirrored files are generated: edit the original in hm-blog and mirror again. A mirrored
post keeps its draft flag, so HM drafts never reach this site's production build.

All posts appear as local tgrecojs.com articles, with local canonical URLs and no
mirroring notices. Hindley Milner Systems is linked only in the footer.

## Offline

`public/sw.js` is a small hand-written service worker, registered only in production builds.
Hashed assets are cached on first use, pages are network-first with a cached fallback, and
a page never opened on that device falls back to `/offline`. Bump `VERSION` in `sw.js` when
you want old caches dropped on the next deploy.

## Social cards

Every published post gets a 1200×630 card at `/og/<post-id>.png`, rendered at build time
by `src/lib/post-image.ts` with Satori and sharp. `npm test` builds the site and checks
each card and its meta tags. Emoji in titles are drawn with
[Twemoji](https://github.com/jdecked/twemoji) graphics, licensed CC-BY 4.0.

## Deploy

Static site; no adapter needed. Connect the repo to Vercel with the Astro preset, or run
`vercel` from this directory. The `site` in `astro.config.mjs` is `https://tgrecojs.com`;
sitemap, RSS and canonical URLs build from it.

Ideas for taking the site fully distributed are in [docs/FUTURE.md](docs/FUTURE.md).
