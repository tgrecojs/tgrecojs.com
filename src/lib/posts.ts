import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const byNewest = (a: Post, b: Post) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

/** Every post a reader can open, newest first. Drafts show in `astro dev`, never in the build. */
export const getPosts = async (): Promise<Post[]> =>
  (await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft)).sort(byNewest);

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });

/** The key a post's comments and likes are stored under. It survives a rename; see `originalId` in content.config.ts. */
export const stableId = (post: Post) => post.data.originalId ?? post.id;

/** Lists alternate cobalt and mustard dots. A post keeps the colour of its slot in the newest-first list. */
export const dotClass = (index: number) => (index % 2 === 0 ? 'dot-a' : 'dot-b');

export const postDot = (post: Post, posts: Post[]) =>
  dotClass(Math.max(0, posts.findIndex((p) => p.id === post.id)));

/** Frontmatter wins. Otherwise count the body's words at 220 wpm, skipping imports, JSX tags and comments. */
export const minutesRead = (post: Post) => {
  if (post.data.minutesRead) return post.data.minutesRead;
  const text = (post.body ?? '')
    .replace(/^import .*$/gm, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

/** Chronological neighbours. `older` was published before this post, `newer` after it. */
export const neighbours = (post: Post, posts: Post[]) => {
  const i = posts.findIndex((p) => p.id === post.id);
  return {
    newer: i > 0 ? posts[i - 1] : undefined,
    older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : undefined,
  };
};

/** Posts from the same series first, then the ones sharing the most tags, newest first within a tie. */
export const related = (post: Post, posts: Post[], limit = 3) => {
  const tags = new Set(post.data.tags);
  return posts
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      p,
      series: post.data.series && p.data.series === post.data.series ? 1 : 0,
      shared: p.data.tags.filter((t) => tags.has(t)).length,
    }))
    .filter((r) => r.series > 0 || r.shared > 0)
    .sort((a, b) => b.series - a.series || b.shared - a.shared || byNewest(a.p, b.p))
    .slice(0, limit)
    .map((r) => r.p);
};
