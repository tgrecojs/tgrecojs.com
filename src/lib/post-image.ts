import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const fonts = Promise.all([
  readFile(require.resolve('@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-600-normal.woff')),
  readFile(require.resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff')),
  readFile(require.resolve('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff')),
]);

// Plex has no emoji, so emoji in a title are drawn from Twemoji's SVGs (graphics CC-BY 4.0,
// credited in the README), read from node_modules at build time with no network fetch.
const twemoji = dirname(require.resolve('@twemoji/svg/package.json'));

// Twemoji names each file by its code points in hex, dropping the FE0F variation selector
// except inside ZWJ sequences: ❤️ is 2764.svg, 🧑‍🚀 is 1f9d1-200d-1f680.svg.
const twemojiFile = (emoji: string) =>
  Array.from(emoji.includes('‍') ? emoji : emoji.replace(/️/g, ''), (char) => char.codePointAt(0)?.toString(16)).join('-');

const loadAdditionalAsset = async (languageCode: string, segment: string) => {
  if (languageCode !== 'emoji') return [];
  try {
    const svg = await readFile(join(twemoji, `${twemojiFile(segment)}.svg`));
    return `data:image/svg+xml;base64,${svg.toString('base64')}`;
  } catch {
    // An emoji newer than this Twemoji release renders as a blank box rather than failing the build.
    return [];
  }
};

interface Card {
  title: string;
  /* Drawn under the title. X and LinkedIn no longer show og:description, so the
     card itself carries the one-line summary that every network still displays. */
  description?: string;
  /* Top-right corner: the post date, or nothing for the site card. */
  pubDate?: Date;
}

type Element = {
  type: string;
  key: null;
  props: { style: Record<string, string | number>; children: string | Element[] };
};

const element = (type: string, style: Element['props']['style'], children: Element['props']['children']): Element =>
  ({ type, key: null, props: { style, children } });

export const renderCard = async ({ title, description, pubDate }: Card) => {
  const [serif, mono, sans] = await fonts;
  const date = pubDate?.toLocaleDateString('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
  });
  // A description takes two or three lines, so the title steps down a size to leave room.
  const titleSize = description
    ? title.length > 90 ? 44 : title.length > 55 ? 54 : 64
    : title.length > 110 ? 48 : title.length > 65 ? 60 : 72;
  const svg = await satori(
    element('div', {
      width: 1200, height: 630, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      background: '#0d1220', color: '#e8edf6', padding: '52px 68px',
      borderBottom: '14px solid #3a5bd9', fontFamily: 'IBM Plex Mono',
    }, [
      element('div', {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 26, borderBottom: '2px solid #2b3550', fontSize: 24,
      }, [
        element('span', { color: '#f4b829' }, 'tgrecojs.com'),
        element('span', { color: '#adb7ca', fontSize: 20 }, date ?? ''),
      ]),
      element('div', {
        display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, minHeight: 0, padding: '24px 0',
      }, [
        element('h1', {
          width: '100%', margin: 0, fontFamily: 'IBM Plex Serif', fontWeight: 600,
          fontSize: titleSize, lineHeight: 1.12, letterSpacing: '-1px', lineClamp: description ? 3 : 4,
          // Even line lengths, so a break never strands a short tail like "- Union Types".
          textWrap: 'balance', overflow: 'hidden', overflowWrap: 'anywhere',
        }, title),
        ...(description
          ? [element('p', {
              width: '100%', maxWidth: 980, margin: '22px 0 0', fontFamily: 'IBM Plex Sans',
              fontSize: 28, lineHeight: 1.4, color: '#adb7ca', lineClamp: 3, overflow: 'hidden', textWrap: 'pretty',
            }, description)]
          : []),
      ]),
      element('div', {
        display: 'flex', alignItems: 'center', gap: 16,
        borderTop: '2px solid #2b3550', paddingTop: 24, fontSize: 23,
      }, [
        element('span', {
          width: 16, height: 16, borderRadius: '50%', background: '#76a0e2',
        }, ''),
        element('span', {}, 'Thomas Greco'),
      ]),
    ]),
    {
      width: 1200, height: 630,
      loadAdditionalAsset,
      fonts: [
        { name: 'IBM Plex Serif', data: serif, weight: 600, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono, weight: 400, style: 'normal' },
        { name: 'IBM Plex Sans', data: sans, weight: 400, style: 'normal' },
      ],
    },
  );
  return sharp(Buffer.from(svg)).png().toBuffer();
};

/** A post's card: title, description and date from its frontmatter. */
export const renderPostImage = (post: { title: string; description: string; pubDate: Date }) =>
  renderCard(post);
