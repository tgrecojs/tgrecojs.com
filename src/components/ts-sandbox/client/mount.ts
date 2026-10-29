// Entry point. Upgrades every <TsSandbox> on the page when its "Edit this
// code" button is pressed: the CDN bundles load once and are shared, and
// each sandbox keeps its own model, original source, Reset and diagnostics.

import { siteConfig } from '../site-config';
import { TS_VERSION } from './config';
import { createSandboxInstance } from './instance';
import { loadSandboxRuntime } from './loader';
import { applyScheme, currentScheme, defineSiteThemes, watchScheme } from './theme';
import type { SandboxRuntime } from './types';

const query = <T extends HTMLElement>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`TsSandbox: missing ${selector}`);
  return element;
};

let themed = false;

const ensureTheme = (runtime: SandboxRuntime) => {
  if (themed) return;
  themed = true;
  defineSiteThemes(runtime.monaco, siteConfig.editor);
  applyScheme(runtime.monaco, currentScheme(siteConfig.editor));
  watchScheme(siteConfig.editor, (scheme) => applyScheme(runtime.monaco, scheme));
  void document.fonts.ready.then(() => runtime.monaco.editor.remeasureFonts());
};

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

const wire = (root: HTMLElement) => {
  const id = root.dataset.sandboxId ?? 'sandbox';
  const title = root.dataset.title ?? 'TypeScript example';
  const source = root.dataset.source ?? '';
  const editButton = query<HTMLButtonElement>(root, '[data-action="edit"]');
  const resetButton = query<HTMLButtonElement>(root, '[data-action="reset"]');
  const staticBlock = query<HTMLElement>(root, '[data-static]');
  const host = query<HTMLElement>(root, '[data-editor]');
  const status = query<HTMLElement>(root, '[data-status]');
  const list = query<HTMLElement>(root, '[data-diagnostics]');
  const hint = query<HTMLElement>(root, '[data-hint]');

  const activate = async () => {
    editButton.disabled = true;
    status.className = 'ts-sandbox__status';
    status.textContent = `Loading the TypeScript ${TS_VERSION} editor…`;
    try {
      const runtime = await loadSandboxRuntime();
      ensureTheme(runtime);
      host.hidden = false;
      const instance = createSandboxInstance(id, title, source, { host, status, list }, runtime);
      staticBlock.hidden = true;
      editButton.hidden = true;
      resetButton.hidden = false;
      hint.hidden = false;
      resetButton.addEventListener('click', () => void instance.reset().catch(() => {}));
      root.dataset.state = 'editing';
      await instance.check();
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) instance.focus();
    } catch (error) {
      host.hidden = true;
      editButton.disabled = false;
      editButton.textContent = 'Try again';
      status.className = 'ts-sandbox__status ts-sandbox__status--error';
      status.textContent = `The editor could not load (${describe(error)}). The code above is still readable; check your connection and try again.`;
      root.dataset.state = 'failed';
      console.error('[TsSandbox]', error);
    }
  };

  editButton.addEventListener('click', () => void activate());
};

document.querySelectorAll<HTMLElement>('[data-ts-sandbox]').forEach(wire);
