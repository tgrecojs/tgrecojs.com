// Entry point. Upgrades every <TsSandbox> on the page when its "Edit this
// code" or "Run" button is pressed: the CDN bundles load once and are shared,
// and each sandbox keeps its own files, original source, output and diagnostics.

import { siteConfig } from '../site-config';
import { TS_VERSION } from './config';
import { createSandboxInstance, type SandboxInstance } from './instance';
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

const parseFiles = (json: string | undefined): Record<string, string> => {
  if (!json) return {};
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) return {};
  return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
};

const wire = (root: HTMLElement) => {
  const source = {
    id: root.dataset.sandboxId ?? 'sandbox',
    title: root.dataset.title ?? 'TypeScript example',
    code: root.dataset.source ?? '',
    files: parseFiles(root.dataset.files),
  };
  const editButton = query<HTMLButtonElement>(root, '[data-action="edit"]');
  const runButton = query<HTMLButtonElement>(root, '[data-action="run"]');
  const resetButton = query<HTMLButtonElement>(root, '[data-action="reset"]');
  const staticBlock = query<HTMLElement>(root, '[data-static]');
  const host = query<HTMLElement>(root, '[data-editor]');
  const status = query<HTMLElement>(root, '[data-status]');
  const list = query<HTMLElement>(root, '[data-diagnostics]');
  const hint = query<HTMLElement>(root, '[data-hint]');
  const output = {
    panel: query<HTMLElement>(root, '[data-output]'),
    lines: query<HTMLElement>(root, '[data-output-lines]'),
    status: query<HTMLElement>(root, '[data-run-status]'),
  };

  let instance: SandboxInstance | undefined;
  let activating: Promise<SandboxInstance> | undefined;

  const activate = async (): Promise<SandboxInstance> => {
    editButton.disabled = true;
    runButton.disabled = true;
    status.className = 'ts-sandbox__status';
    status.textContent = `Loading the TypeScript ${TS_VERSION} editor…`;
    try {
      const runtime = await loadSandboxRuntime();
      ensureTheme(runtime);
      host.hidden = false;
      const created = createSandboxInstance(source, { host, status, list, output, runButton }, runtime);
      instance = created;
      staticBlock.hidden = true;
      editButton.hidden = true;
      resetButton.hidden = false;
      hint.hidden = false;
      runButton.disabled = false;
      resetButton.addEventListener('click', () => void created.reset().catch(() => {}));
      root.dataset.state = 'editing';
      await created.check();
      return created;
    } catch (error) {
      host.hidden = true;
      editButton.disabled = false;
      runButton.disabled = false;
      editButton.textContent = 'Try again';
      status.className = 'ts-sandbox__status ts-sandbox__status--error';
      status.textContent = `The editor could not load (${describe(error)}). The code above is still readable; check your connection and try again.`;
      root.dataset.state = 'failed';
      console.error('[TsSandbox]', error);
      throw error;
    }
  };

  const ensureInstance = () => {
    if (instance) return Promise.resolve(instance);
    activating ??= activate().catch((error: unknown) => {
      activating = undefined;
      throw error;
    });
    return activating;
  };

  editButton.addEventListener('click', () => {
    void ensureInstance()
      .then((created) => {
        if (matchMedia('(hover: hover) and (pointer: fine)').matches) created.focus();
      })
      .catch(() => {});
  });

  runButton.addEventListener('click', () => {
    void ensureInstance()
      .then((created) => created.run())
      .catch(() => {});
  });
};

document.querySelectorAll<HTMLElement>('[data-ts-sandbox]').forEach(wire);
