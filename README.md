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

In post comments, **PFU** means **Prospective Future Update**. Preserve these notes:
they record ideas to revisit later, rather than work required before publication.
Other editorial comments describe changes to address in the current draft.

### Working with agents

Repository-wide writing and editing conventions live in [AGENTS.md](AGENTS.md).
The repeatable proofreading workflow lives in
[`.agents/skills/proofread-post/SKILL.md`](.agents/skills/proofread-post/SKILL.md).
In Codex, ask `$proofread-post` to review or edit a named post. For an agent that
does not discover these files automatically, explicitly ask it to read them.

The draft in this repo is the publication copy. Logseq remains a personal learning
notebook; agents do not need access to it for a normal proofreading pass. Supply a
specific notebook page when its experiments are relevant, and treat it as read-only
unless an update is requested.

To embed a Colorfigures figure, drop its self-contained HTML in `public/figures/` and add
`figure: /figures/name.html` to the frontmatter. It renders above the post body in an
iframe, with a link to open it full screen.

## Site config, post footer and social cards

`src/site.ts` holds the facts more than one template needs: the author line, the footer
links, and the webring. The webring
badge in the footer (`src/components/Webring.astro`) draws the ring as an orbit and links
to webri.ng's previous, random and next endpoints; it renders nothing while `webring.url`
is empty.

Every post ends with `src/components/PostFooter.astro`: the author line with the share
controls (copy link, and the system share sheet where the browser has one), the previous
and next post by date, and up to three related posts (same series first, then shared tags,
never repeating the neighbours). `src/lib/posts.ts` has the list helpers:
published posts newest first, reading time from the body when `minutesRead` is not set,
neighbours, related posts, and the alternating dot colour (cobalt on even slots, mustard
on odd).

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
by `src/lib/post-image.ts` with Satori and sharp. The card carries the title, the
description and the date, because X and LinkedIn no longer show `og:description` next to
a link and the image is the one thing every network still displays. Pages that are not
posts share the site card at `/og/home.png`. `npm test` builds the site and checks
each card and its meta tags. Emoji in titles are drawn with
[Twemoji](https://github.com/jdecked/twemoji) graphics, licensed CC-BY 4.0.

## Deploy

Static site; no adapter needed. Connect the repo to Vercel with the Astro preset, or run
`vercel` from this directory. The `site` in `astro.config.mjs` is `https://tgrecojs.com`;
sitemap, RSS and canonical URLs build from it.

Ideas for taking the site fully distributed are in [docs/FUTURE.md](docs/FUTURE.md).
