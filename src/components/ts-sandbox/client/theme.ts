// Monaco themes built from the site's palette, and a watcher that follows
// the page's colour scheme. Monaco themes are global, so these are applied
// once per page rather than per editor.

import { siteConfig } from '../site-config';
import type { EditorPalette, MonacoNamespace, MonacoTheme, SandboxRuntime, Scheme, SiteConfig } from './types';

type EditorConfig = SiteConfig['editor'];

const THEME_NAMES: Record<Scheme, string> = {
  light: 'ts-sandbox-light',
  dark: 'ts-sandbox-dark',
};

const SCHEMES: Scheme[] = ['light', 'dark'];

/** Registers the site's light and dark editor themes with Monaco. */
export const defineSiteThemes = (monaco: MonacoNamespace, editor: EditorConfig) => {
  for (const scheme of SCHEMES) {
    monaco.editor.defineTheme(THEME_NAMES[scheme], toMonacoTheme(scheme, editor.palette[scheme]));
  }
};

export const applyScheme = (monaco: MonacoNamespace, scheme: Scheme) => {
  monaco.editor.setTheme(THEME_NAMES[scheme]);
};

/** The scheme the page is showing right now. */
export const currentScheme = (editor: EditorConfig): Scheme => {
  if (editor.scheme !== 'auto') return editor.scheme;
  const forced = document.documentElement.dataset.theme;
  if (forced === 'light' || forced === 'dark') return forced;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Calls `onChange` whenever the page's scheme changes. Returns a stop function. */
export const watchScheme = (editor: EditorConfig, onChange: (scheme: Scheme) => void) => {
  if (editor.scheme !== 'auto') return () => {};
  const media = matchMedia('(prefers-color-scheme: dark)');
  const notify = () => onChange(currentScheme(editor));
  media.addEventListener('change', notify);
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    media.removeEventListener('change', notify);
    observer.disconnect();
  };
};

let themed = false;

/**
 * Defines the site's editor themes, applies the current scheme and follows
 * changes. Runs once per page however many sandboxes (of either kind) call it.
 */
export const ensureSiteTheme = (runtime: SandboxRuntime) => {
  if (themed) return;
  themed = true;
  defineSiteThemes(runtime.monaco, siteConfig.editor);
  applyScheme(runtime.monaco, currentScheme(siteConfig.editor));
  watchScheme(siteConfig.editor, (scheme) => applyScheme(runtime.monaco, scheme));
  void document.fonts.ready.then(() => runtime.monaco.editor.remeasureFonts());
};

const hex = (colour: string) => colour.replace(/^#/, '');

const toMonacoTheme = (scheme: Scheme, palette: EditorPalette): MonacoTheme => ({
  base: scheme === 'dark' ? 'vs-dark' : 'vs',
  inherit: true,
  rules: [
    { token: '', foreground: hex(palette.foreground) },
    { token: 'comment', foreground: hex(palette.comment), fontStyle: 'italic' },
    { token: 'keyword', foreground: hex(palette.keyword) },
    { token: 'string', foreground: hex(palette.string) },
    { token: 'number', foreground: hex(palette.number) },
    { token: 'type.identifier', foreground: hex(palette.type) },
    { token: 'identifier', foreground: hex(palette.foreground) },
    { token: 'delimiter', foreground: hex(palette.foreground) },
  ],
  colors: {
    'editor.background': palette.background,
    'editor.foreground': palette.foreground,
    'editorGutter.background': palette.background,
    'editorLineNumber.foreground': palette.lineNumber,
    'editorLineNumber.activeForeground': palette.foreground,
    'editorCursor.foreground': palette.foreground,
    'editor.selectionBackground': palette.selection,
    'editor.inactiveSelectionBackground': palette.selection,
    'editorError.foreground': palette.error,
    'editorIndentGuide.background1': palette.selection,
  },
});
