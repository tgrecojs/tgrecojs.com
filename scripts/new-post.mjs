#!/usr/bin/env node
/**
 * Scaffold a new post.
 *
 *   npm run new-post -- --title "What I saw tonight" --tags telescope,sky
 *
 * Options: --title (required), --tags a,b,c, --figure /figures/name.html, --published
 * New posts are drafts unless --published is passed.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 || i + 1 >= args.length ? undefined : args[i + 1];
};

const title = get('title');
if (!title) {
  console.error('--title is required');
  process.exit(1);
}
const slug = title
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const tags = (get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const figure = get('figure');
const today = new Date().toISOString().slice(0, 10);

const file = resolve(here, `../src/content/posts/${slug}.mdx`);
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}

const fm = [
  '---',
  `title: ${JSON.stringify(title)}`,
  'description: ""',
  `pubDate: ${today}`,
  `tags: ${JSON.stringify(tags)}`,
  `draft: ${!args.includes('--published')}`,
  figure ? `figure: "${figure}"` : null,
  '---',
  '',
  '',
]
  .filter((l) => l !== null)
  .join('\n');

writeFileSync(file, fm);
console.log(`created src/content/posts/${slug}.mdx`);
