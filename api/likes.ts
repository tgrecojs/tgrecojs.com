// A post's like count, and the site's only server code: Vercel serves this file as a
// function at /api/likes, next to the static Astro build. GET /api/likes?id=<post> reads the
// count; POST adds the caller's like and returns the new count.
//
// A like counts once per network address. The addresses go into a Redis HyperLogLog, which
// counts distinct values without keeping the values, so no reader's address is stored and
// the count can be off by about 1%. The store is Upstash Redis from the Vercel Marketplace,
// which hands this function its credentials as environment variables.
//
// Only the production deployment counts real likes. Preview deployments and `astro dev`
// (which runs this file through a small plugin in astro.config.mjs) keep their counts under
// separate keys in the same store.
import { Redis } from '@upstash/redis';

const KEYS = process.env.VERCEL_ENV === 'production' ? 'likes' : 'likes-test';

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

// A post id is its path under src/content/posts without the extension: lowercase words
// joined by hyphens, with a slash after a folder. This function cannot see the content
// folder, so it checks the shape of an id, not that the post exists.
const POST_ID = /^[a-z0-9]+([-/][a-z0-9]+)*$/;

export default {
  async fetch(request: Request) {
    const { method, headers, url } = request;
    if (method !== 'GET' && method !== 'POST') return json({ error: 'Use GET or POST.' }, 405);

    const id = new URL(url).searchParams.get('id') ?? '';
    if (id.length > 100 || !POST_ID.test(id)) return json({ error: 'Not a post id.' }, 400);

    const key = `${KEYS}:${id}`;
    try {
      const redis = Redis.fromEnv();
      // Vercel sets x-forwarded-for to the caller's address and overwrites any value sent.
      if (method === 'POST') await redis.pfadd(key, headers.get('x-forwarded-for') ?? 'unknown');
      return json({ count: await redis.pfcount(key) });
    } catch (error) {
      console.error('[likes]', error);
      return json({ error: 'Likes are unavailable.' }, 503);
    }
  },
};
