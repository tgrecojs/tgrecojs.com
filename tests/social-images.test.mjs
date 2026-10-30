import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

const dist = new URL('../dist/', import.meta.url);
const meta = (html, key) => {
  const tag = html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`));
  return tag?.[1];
};

// Catches missing, misrouted, or invalid social images in the actual deployment output.
test('every published article advertises a decodable large social image', async () => {
  const rss = await readFile(new URL('rss.xml', dist), 'utf8');
  const links = [...rss.matchAll(/<link>(https:\/\/tgrecojs\.com\/posts\/[^<]+)<\/link>/g)];
  assert.ok(links.length > 0, 'must verify published posts');
  for (const [, link] of links) {
    const slug = new URL(link).pathname.replace(/\/$/, '').split('/').pop();
    const html = await readFile(new URL(`posts/${slug}/index.html`, dist), 'utf8');
    const expected = `https://tgrecojs.com/og/${slug}.png`;
    assert.equal(meta(html, 'og:image'), expected, `${slug}: Open Graph image`);
    assert.equal(meta(html, 'twitter:image'), expected, `${slug}: Twitter image`);
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
    assert.equal(meta(html, 'og:image:width'), '1200');
    assert.equal(meta(html, 'og:image:height'), '630');
    assert.equal(meta(html, 'og:image:type'), 'image/png');
    assert.ok(meta(html, 'og:image:alt'), `${slug}: image description`);
    assert.equal(meta(html, 'twitter:image:alt'), meta(html, 'og:image:alt'));
    const bytes = await readFile(new URL(`og/${slug}.png`, dist));
    const image = await sharp(bytes).metadata();
    assert.equal(image.format, 'png');
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.ok(bytes.length < 1_000_000, `${slug}: image should stay below 1 MB`);
  }
  const images = await readdir(new URL('og/', dist));
  assert.equal(images.length, links.length, 'only published posts get images');
  assert.ok(!images.includes('ts-sandbox-fixture.png'), 'draft fixture stays private');
});
