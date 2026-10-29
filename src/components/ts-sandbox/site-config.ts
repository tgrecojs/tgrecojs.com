// Site-specific settings for TsSandbox. This is the one file in the folder
// that differs between hm-blog and tgrecojs.com. The static block uses the
// site's dual Night sky Shiki themes (see src/styles/shiki-night-sky.mjs),
// and the editor palette follows the same colours, switching with the page.

import { nightSkyDark, nightSkyLight } from '../../styles/shiki-night-sky.mjs';
import type { SiteConfig } from './client/types';

export const siteConfig: SiteConfig = {
  shiki: { themes: { light: nightSkyLight, dark: nightSkyDark }, defaultColor: false },
  editor: {
    scheme: 'auto',
    fontFamily: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
    palette: {
      light: {
        background: '#ffffff',
        foreground: '#0f1726',
        lineNumber: '#677189',
        selection: '#d6e0fb',
        error: '#c2401f',
        comment: '#677189',
        keyword: '#2f55d4',
        string: '#8a5a00',
        number: '#b5401f',
        type: '#1d7650',
      },
      dark: {
        background: '#080c17',
        foreground: '#dfe6f3',
        lineNumber: '#76839c',
        selection: '#2b3550',
        error: '#ef6a4c',
        comment: '#76839c',
        keyword: '#8cb0ff',
        string: '#f4c95d',
        number: '#ef8a6c',
        type: '#93d3b0',
      },
    },
  },
};
