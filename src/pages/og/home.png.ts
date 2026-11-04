import type { APIRoute } from 'astro';
import { renderCard } from '../../lib/post-image';
import { site } from '../../site';

// The card for every page that is not a post: the home page, tag pages, offline.
export const GET: APIRoute = async () => {
  const image = await renderCard({ title: site.author, description: site.description });
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
