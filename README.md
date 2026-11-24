# tgrecojs.com

Thomas Greco's personal site. Astro, static output, deployed on Vercel.

Posts are MDX files in `src/content/posts`. This site is the source of truth: engineering
posts flagged with `crosspost: hindleymilner` are mirrored to blog.hindleymilner.com.

## Commands

| Command                         | What it does                                          |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | Dev server at localhost:4321 (drafts visible)         |
| `npm run build`                 | Typecheck and build to `dist/` (drafts excluded)      |
| `npm run preview`               | Serve `dist/` locally                                 |
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

Every post ends with `src/components/PostFooter.astro`: the author line with the like
button and the share controls (copy link, and the system share sheet where the browser has
one), the previous and next post by date, up to three related posts (same series first,
then shared tags, never repeating the neighbours), and the comments once they are
configured. `src/lib/posts.ts` has the list helpers:
published posts newest first, reading time from the body when `minutesRead` is not set,
neighbours, related posts, and the alternating dot colour (cobalt on even slots, mustard
on odd).

## Likes and comments

`api/likes.ts` is the site's only server code. Vercel deploys it as a function at
`/api/likes`, beside the static build, and it keeps one count per post in an Upstash Redis
store installed from the Vercel Marketplace. A like counts once per network address, and
no address is stored; the file's header explains how. A small plugin in `astro.config.mjs`
runs the same function under `astro dev`, using the credentials `vercel env pull` writes
to `.env.local`. Only the production deployment counts real likes: previews and local dev
keep theirs under separate keys.

Comments are GitHub Discussions shown by [giscus](https://giscus.app). They appear once
`comments.repoId` and `comments.categoryId` are set in `src/site.ts`. The repo named there
must be public, have Discussions turned on and have the giscus app installed.

Likes and comments are stored under the post's id. When you rename a post, set
`originalId` in its frontmatter to the old id so both follow it.

## Analytics events

Umami counts page views on its own. The site also sends it these named events:

| Event                         | Sent when                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `read-to-end`                 | A post's ending is on screen and the page has been open for a quarter of its reading time  |
| `like`                        | A reader likes a post (`id` is the post)                                                   |
| `share`                       | A reader shares a post from the system share sheet                                         |
| `copy-link`                   | A reader copies a post's link                                                              |
| `sandbox-edit`, `sandbox-run` | A reader opens or runs a code sandbox (`id` is the sandbox)                                |
| `webring`                     | A reader follows a webring link (`to` is `ring`, `previous`, `random` or `next`)           |

Scripts send an event with `track()` from `src/lib/track.ts`; a link can carry a
`data-umami-event` attribute instead. The Umami script loads only in production builds, so
nothing is sent from `astro dev`.

## Cross-posting to Hindley Milner Systems

Add `crosspost: hindleymilner` to the frontmatter of an engineering post. Leave it off
personal posts. Then, from a sibling checkout of hm-blog:

```bash
cd ../hm-blog && npm run mirror
```

Only published posts (`draft: false`) are mirrored. The copy on blog.hindleymilner.com
gets a canonical URL pointing back here, so search engines credit this site.

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
`vercel` from this directory. Vercel picks up `api/likes.ts` as a function on its own. The `site` in `astro.config.mjs` is `https://tgrecojs.com`;
sitemap, RSS and canonical URLs build from it.

Ideas for taking the site fully distributed are in [docs/FUTURE.md](docs/FUTURE.md).
