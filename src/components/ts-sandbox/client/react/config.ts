// Where ReactSandbox gets React and its type definitions. Everything is
// pinned and fetched from jsDelivr, the npm mirror, only when a reader runs a
// preview or opens an editor. The runtime (`+esm` builds) is loaded inside the
// preview frame through an import map; `react-dom/client` imports the same
// `react@<version>/+esm` URL the map points at, so one React instance serves
// hooks and rendering. The `.d.ts` files go to Monaco as extra libs under a
// virtual node_modules, where `import ... from 'react'` resolves to them.

export const REACT_VERSION = '19.3.1';
export const REACT_TYPES_VERSION = '19.3.0';
export const CSSTYPE_VERSION = '3.2.3';

const CDN = 'https://cdn.jsdelivr.net/npm';

/** Bare specifiers the preview frame resolves, in import-map form. */
export const importMap: Record<string, string> = {
  react: `${CDN}/react@${REACT_VERSION}/+esm`,
  'react/jsx-runtime': `${CDN}/react@${REACT_VERSION}/jsx-runtime/+esm`,
  'react-dom': `${CDN}/react-dom@${REACT_VERSION}/+esm`,
  'react-dom/client': `${CDN}/react-dom@${REACT_VERSION}/client/+esm`,
};

/** Type definitions the editor needs, and the virtual path each is registered at. */
export const typeFiles: { path: string; url: string }[] = [
  { path: '/node_modules/@types/react/index.d.ts', url: `${CDN}/@types/react@${REACT_TYPES_VERSION}/index.d.ts` },
  { path: '/node_modules/@types/react/global.d.ts', url: `${CDN}/@types/react@${REACT_TYPES_VERSION}/global.d.ts` },
  { path: '/node_modules/@types/react/jsx-runtime.d.ts', url: `${CDN}/@types/react@${REACT_TYPES_VERSION}/jsx-runtime.d.ts` },
  { path: '/node_modules/csstype/index.d.ts', url: `${CDN}/csstype@${CSSTYPE_VERSION}/index.d.ts` },
];

/** Give up on a preview that has not reported back after this long. */
export const PREVIEW_TIMEOUT_MS = 20_000;

/** Wait this long after the last keystroke before re-rendering a live preview. */
export const RENDER_DEBOUNCE_MS = 600;

/** How the preview's files are compiled: modern ES modules with the automatic JSX runtime. */
export const transpileOptions = { module: 99, target: 99, jsx: 4 }; // ESNext, ESNext, ReactJSX
