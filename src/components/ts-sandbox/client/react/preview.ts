// The live preview: a sandboxed <iframe> (opaque origin, scripts only) whose
// document is built here from the compiled files. React arrives through an
// import map; the sandbox's own modules are `data:` URLs on the same map, so
// `import { Timer } from './Timer'` becomes `import ... from 'sandbox:Timer'`
// and resolves without a bundler. The frame reports back over postMessage:
// ready, runtime errors, console output and its content height. A re-render
// builds a fresh frame behind the live one and swaps when it is ready, so the
// last working preview stays up while the reader types.

import type { Scheme } from '../types';
import { importMap, PREVIEW_TIMEOUT_MS } from './config';

export type PreviewLevel = 'log' | 'info' | 'warn' | 'error';

export type PreviewEvent =
  | { kind: 'ready'; durationMs: number }
  | { kind: 'error'; message: string; phase: 'load' | 'live' }
  | { kind: 'console'; level: PreviewLevel; args: unknown[] }
  | { kind: 'timeout' };

export type ThemeVars = Record<string, string>;

export interface PreviewRequest {
  /** Module name (file name without extension) → JavaScript, relative imports already rewritten to `sandbox:<name>`. */
  modules: Record<string, string>;
  /** File that exports the component to mount, e.g. "Timer.tsx". */
  entryFile: string;
  /** The export to mount. */
  component: string;
  theme: ThemeVars;
}

export interface Preview {
  render: (request: PreviewRequest, onEvent: (event: PreviewEvent) => void) => void;
  setTheme: (theme: ThemeVars) => void;
}

interface Frame {
  element: HTMLIFrameElement;
  token: string;
  onEvent: (event: PreviewEvent) => void;
  ready: boolean;
  /** Set once the frame has reported a real (non-zero) height. */
  measured: boolean;
  timer?: number;
  measureTimers: number[];
}

interface FrameMessage {
  channel?: string;
  token?: string;
  kind?: string;
  message?: string;
  level?: PreviewLevel;
  args?: unknown[];
  height?: number;
  durationMs?: number;
}

const CHANNEL = 'react-sandbox';
const MIN_HEIGHT = 72;
const MAX_HEIGHT = 640;
/** When to ask a newly live frame for its height, until it reports one; a background tab can take a while. */
const MEASURE_RETRY_MS = [0, 100, 400, 1000, 2500, 6000];

/** CSS custom properties copied from the page into the frame; `.ts-sandbox` resolves them from the site's tokens. */
const THEME_VARS = [
  '--tss-paper',
  '--tss-surface',
  '--tss-text',
  '--tss-muted',
  '--tss-border',
  '--tss-edge',
  '--tss-accent',
  '--tss-error',
  '--tss-mono',
  '--tss-body',
  '--tss-display',
];

export const readTheme = (root: HTMLElement, scheme: Scheme): ThemeVars => {
  const style = getComputedStyle(root);
  const theme = Object.fromEntries(THEME_VARS.map((name) => [name, style.getPropertyValue(name).trim()]));
  theme['color-scheme'] = scheme;
  return theme;
};

export const createPreview = (host: HTMLElement, title: string): Preview => {
  let live: Frame | undefined;
  let pending: Frame | undefined;

  const discard = (frame: Frame | undefined) => {
    if (!frame) return;
    window.clearTimeout(frame.timer);
    frame.measureTimers.forEach((timer) => window.clearTimeout(timer));
    frame.element.remove();
  };

  const requestMeasure = (frame: Frame) => {
    frame.element.contentWindow?.postMessage({ channel: CHANNEL, kind: 'measure' }, '*');
  };

  const promote = (frame: Frame) => {
    window.clearTimeout(frame.timer);
    frame.ready = true;
    discard(live);
    live = frame;
    pending = undefined;
    delete frame.element.dataset.pending;
    // Now that the frame is visible its layout is real; ask for the height
    // until it answers with one.
    frame.measureTimers = MEASURE_RETRY_MS.map((delay) =>
      window.setTimeout(() => {
        if (!frame.measured) requestMeasure(frame);
      }, delay),
    );
  };

  window.addEventListener('message', (event: MessageEvent<FrameMessage>) => {
    const data = event.data;
    if (!data || data.channel !== CHANNEL) return;
    const frame = [pending, live].find((candidate) => candidate && candidate.token === data.token);
    if (!frame || event.source !== frame.element.contentWindow) return;

    switch (data.kind) {
      case 'resize':
        // A frame that has not been laid out yet reports 0; keep the current height until it has.
        if (typeof data.height === 'number' && data.height > 0) {
          frame.measured = true;
          frame.element.style.height = `${Math.min(Math.max(Math.ceil(data.height), MIN_HEIGHT), MAX_HEIGHT)}px`;
        }
        return;
      case 'ready':
        if (frame === pending) promote(frame);
        frame.onEvent({ kind: 'ready', durationMs: data.durationMs ?? 0 });
        return;
      case 'error':
        if (frame === pending) {
          discard(frame);
          pending = undefined;
          frame.onEvent({ kind: 'error', message: data.message ?? 'unknown error', phase: 'load' });
        } else {
          frame.onEvent({ kind: 'error', message: data.message ?? 'unknown error', phase: 'live' });
        }
        return;
      case 'console':
        frame.onEvent({ kind: 'console', level: data.level ?? 'log', args: data.args ?? [] });
        return;
    }
  });

  const render: Preview['render'] = (request, onEvent) => {
    discard(pending);
    const token = Math.random().toString(36).slice(2);
    const element = document.createElement('iframe');
    element.title = title;
    element.setAttribute('sandbox', 'allow-scripts');
    element.dataset.pending = '';
    element.srcdoc = buildDocument(request, token);
    const frame: Frame = { element, token, onEvent, ready: false, measured: false, measureTimers: [] };
    frame.timer = window.setTimeout(() => {
      if (pending !== frame) return;
      discard(frame);
      pending = undefined;
      onEvent({ kind: 'timeout' });
    }, PREVIEW_TIMEOUT_MS);
    pending = frame;
    host.append(element);
  };

  const setTheme: Preview['setTheme'] = (theme) => {
    for (const frame of [live, pending]) {
      frame?.element.contentWindow?.postMessage({ channel: CHANNEL, kind: 'theme', theme }, '*');
    }
  };

  return { render, setTheme };
};

const fontsStylesheet = () =>
  document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]')?.href;

const buildDocument = (request: PreviewRequest, token: string) => {
  const imports: Record<string, string> = { ...importMap };
  for (const [name, js] of Object.entries(request.modules)) imports[`sandbox:${name}`] = toDataUrl(js);
  const config = {
    channel: CHANNEL,
    token,
    entry: `sandbox:${stripExtension(request.entryFile)}`,
    entryFile: request.entryFile,
    component: request.component,
  };
  const fonts = fontsStylesheet();
  return [
    '<!doctype html>',
    `<html lang="en">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    fonts ? `<link rel="stylesheet" href="${escapeAttribute(fonts)}">` : '',
    `<style>${themeCss(request.theme)}${BASE_CSS}</style>`,
    `<script type="importmap">${json({ imports })}</script>`,
    '</head>',
    '<body>',
    '<div id="root"></div>',
    `<script type="module">${HARNESS.replace('__CONFIG__', json(config))}</script>`,
    '</body>',
    '</html>',
  ].join('\n');
};

/** JSON that is safe inside an inline <script>: no `<` can end the element early. */
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const stripExtension = (name: string) => name.replace(/\.(tsx?|jsx?)$/, '');

const toDataUrl = (js: string) => `data:text/javascript;base64,${toBase64(new TextEncoder().encode(js))}`;

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const themeCss = (theme: ThemeVars) => {
  const declarations = Object.entries(theme)
    .filter(([, value]) => value && !/[<>{}]/.test(value))
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  return `:root{${declarations}}`;
};

/**
 * Base styles for whatever the reader's component renders, so a bare <button> or <h2>
 * in an example looks like the site rather than the browser: body text at 16px, serif
 * headings, the site's inked pill buttons (44px, the touch floor) and 16px fields (no
 * iOS zoom on focus). No bullets; list items are divided by a rule instead.
 */
const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{height:auto}
body{margin:0;padding:1.1rem 1.25rem;font:400 16px/1.6 var(--tss-body,system-ui,sans-serif);color:var(--tss-text,#15181f);background:var(--tss-paper,#fff);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-synthesis:none}
p{margin:0 0 .75rem}
h1,h2,h3{font:600 1.15rem/1.3 var(--tss-display,Georgia,serif);letter-spacing:-.01em;margin:0 0 .35rem;text-wrap:balance}
button{display:inline-flex;align-items:center;gap:.45em;min-height:44px;padding:0 1rem;margin:0 .5rem .5rem 0;font:500 .8125rem/1 var(--tss-mono,ui-monospace,Menlo,monospace);color:var(--tss-text,#15181f);background:transparent;border:1.5px solid var(--tss-edge,currentColor);border-radius:999px;cursor:pointer;transition:border-color 150ms ease-out,color 150ms ease-out,transform 100ms ease-out}
button:hover{border-color:var(--tss-accent,#2f55d4);color:var(--tss-accent,#2f55d4)}
button:active{transform:scale(.96)}
button:focus-visible{outline:2px solid var(--tss-accent,#2f55d4);outline-offset:2px}
button:disabled{opacity:.55;cursor:not-allowed;transform:none}
input,select,textarea{min-height:44px;padding:0 .75rem;font:400 16px/1.4 var(--tss-body,system-ui,sans-serif);color:inherit;background:var(--tss-paper,#fff);border:1.5px solid var(--tss-edge,currentColor);border-radius:6px}
textarea{padding:.6rem .75rem}
input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--tss-accent,#2f55d4);outline-offset:2px}
ul,ol{margin:0 0 .75rem;padding:0;list-style:none;display:grid;gap:1rem}
li{border-top:1px solid var(--tss-border,#8a8f9c);padding-top:1rem}
li:first-child{border-top:0;padding-top:0}
code{font-family:var(--tss-mono,ui-monospace,Menlo,monospace);font-size:.9em}
@media(prefers-reduced-motion:reduce){button{transition:none}}
`;

/**
 * Runs inside the frame. Mounts the component, mirrors console output and
 * errors to the page, and reports the document height so the frame can be
 * sized to its content. `__CONFIG__` is replaced with JSON when the document
 * is built.
 */
const HARNESS = `
const cfg = __CONFIG__;
const post = (message) => parent.postMessage({ channel: cfg.channel, token: cfg.token, ...message }, '*');
const describe = (error) => (error instanceof Error ? error.name + ': ' + error.message : String(error));
const cloneable = (value) => {
  try { structuredClone(value); return value; }
  catch { return typeof value === 'function' ? '[Function: ' + (value.name || 'anonymous') + ']' : String(value); }
};
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    original(...args);
    post({ kind: 'console', level: level === 'debug' ? 'log' : level, args: args.map(cloneable) });
  };
}
addEventListener('error', (event) => post({ kind: 'error', message: event.error ? describe(event.error) : String(event.message) }));
addEventListener('unhandledrejection', (event) => post({ kind: 'error', message: describe(event.reason) }));
// The frame loads hidden behind the live preview, and browsers throttle
// rendering callbacks (requestAnimationFrame, ResizeObserver) in hidden or
// background cross-origin frames. So readiness comes from a React effect, and
// the height from a forced layout taken when the page asks (once the frame is
// live) and whenever the DOM changes; ResizeObserver covers the rest.
const measure = () => post({ kind: 'resize', height: document.documentElement.getBoundingClientRect().height });
let measureTimer;
const measureSoon = () => {
  clearTimeout(measureTimer);
  measureTimer = setTimeout(measure, 0);
};
addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || event.data.channel !== cfg.channel) return;
  if (event.data.kind === 'measure') measure();
  if (event.data.kind === 'theme') {
    for (const [name, value] of Object.entries(event.data.theme)) document.documentElement.style.setProperty(name, value);
  }
});
new ResizeObserver(measureSoon).observe(document.documentElement);
new MutationObserver(measureSoon).observe(document.getElementById('root'), { subtree: true, childList: true, characterData: true, attributes: true });
const started = performance.now();
try {
  const [{ createRoot }, { createElement, useEffect }, module] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import(cfg.entry),
  ]);
  const Component = module[cfg.component];
  if (typeof Component !== 'function') {
    throw new Error(cfg.entryFile + ' does not export a component named ' + cfg.component);
  }
  const Mounted = () => {
    useEffect(() => {
      measure();
      post({ kind: 'ready', durationMs: performance.now() - started });
    }, []);
    return createElement(Component);
  };
  createRoot(document.getElementById('root')).render(createElement(Mounted));
} catch (error) {
  post({ kind: 'error', message: describe(error) });
}
`;
