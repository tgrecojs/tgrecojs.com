#!/usr/bin/env node
/**
 * Mirror posts from the Hindley Milner blog into this site.
 *
 *   npm run mirror                 # copies every post from ../hm-blog
 *   npm run mirror -- --src PATH   # a different checkout of hm-blog
 *
 * Each mirrored file gets `source: hindleymilner` added to its frontmatter
 * and a header comment. Published pages use local canonical URLs. Mirrored files are generated: edit the original in
 * hm-blog and run this again. Drafts stay drafts, so they never reach the production build.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const srcArg = args[args.indexOf('--src') + 1];
const SRC = resolve(here, args.includes('--src') && srcArg ? srcArg : '../../hm-blog/src/content/blog');
const DEST = resolve(here, '../src/content/posts');

if (!existsSync(SRC)) {
  console.error(`hm-blog posts not found at ${SRC}`);
  process.exit(1);
}
mkdirSync(DEST, { recursive: true });

const files = readdirSync(SRC).filter((f) => /\.mdx?$/.test(f));
let n = 0;
for (const file of files) {
  const id = basename(file, extname(file));
  const raw = readFileSync(join(SRC, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    console.warn(`skip ${file}: no frontmatter`);
    continue;
  }
  let fm = m[1]
    .split(/\r?\n/)
    .filter((line) => !/^(source|canonical):/.test(line))
    .join('\n');
  fm += `\nsource: hindleymilner`;
  const body = raw.slice(m[0].length);
  const header = `{/* Mirrored from hindleymilner.com by scripts/mirror-hm.mjs. Edit the original in hm-blog, then run \`npm run mirror\`. */}\n\n`;
  const out = `---\n${fm}\n---\n\n${header}${body}`;
  const dest = join(DEST, `${id}.mdx`);
  if (existsSync(dest) && readFileSync(dest, 'utf8') === out) continue;
  writeFileSync(dest, out);
  console.log(`mirrored ${id}`);
  n++;
}
console.log(n ? `${n} file(s) updated` : 'already up to date');
