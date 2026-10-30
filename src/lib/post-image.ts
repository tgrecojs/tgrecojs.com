import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const fonts = Promise.all([
  readFile(require.resolve('@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-600-normal.woff')),
  readFile(require.resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff')),
]);

interface PostImage {
  title: string;
  pubDate: Date;
}

type Element = {
  type: string;
  key: null;
  props: { style: Record<string, string | number>; children: string | Element[] };
};

const element = (type: string, style: Element['props']['style'], children: Element['props']['children']): Element =>
  ({ type, key: null, props: { style, children } });

export const renderPostImage = async ({ title, pubDate }: PostImage) => {
  const [serif, mono] = await fonts;
  const date = pubDate.toLocaleDateString('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
  });
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
        element('span', { color: '#adb7ca', fontSize: 20 }, date),
      ]),
      element('div', {
        display: 'flex', flexGrow: 1, minHeight: 0, alignItems: 'center', padding: '24px 0',
      }, [
        element('h1', {
          width: '100%', margin: 0, fontFamily: 'IBM Plex Serif', fontWeight: 600,
          fontSize: title.length > 110 ? 48 : title.length > 65 ? 60 : 72,
          lineHeight: 1.12, letterSpacing: '-1px', lineClamp: 4,
          overflow: 'hidden', overflowWrap: 'anywhere',
        }, title),
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
      fonts: [
        { name: 'IBM Plex Serif', data: serif, weight: 600, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  );
  return sharp(Buffer.from(svg)).png().toBuffer();
};
