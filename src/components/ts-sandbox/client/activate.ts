// Upgrades one sandbox element from its static code block into a live editor
// when its "Edit this code" or "Run" button is pressed. The CDN bundles load
// once per page and are shared; each sandbox keeps its own instance. TsSandbox
// and ReactSandbox differ only in the instance they create, so both mounts
// go through this module.

import { TS_VERSION } from './config';
import { loadSandboxRuntime } from './loader';
import { ensureSiteTheme } from './theme';
import type { SandboxRuntime } from './types';
import { describe, query } from './util';

export interface Activatable {
  check: () => Promise<unknown>;
  run: () => Promise<void> | void;
  reset: () => Promise<unknown>;
  focus: () => void;
}

/** The elements every sandbox kind renders. */
export interface CommonElements {
  editButton: HTMLButtonElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  staticBlock: HTMLElement;
  host: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  hint: HTMLElement;
}

export const commonElements = (root: HTMLElement): CommonElements => ({
  editButton: query<HTMLButtonElement>(root, '[data-action="edit"]'),
  runButton: query<HTMLButtonElement>(root, '[data-action="run"]'),
  resetButton: query<HTMLButtonElement>(root, '[data-action="reset"]'),
  staticBlock: query<HTMLElement>(root, '[data-static]'),
  host: query<HTMLElement>(root, '[data-editor]'),
  status: query<HTMLElement>(root, '[data-status]'),
  list: query<HTMLElement>(root, '[data-diagnostics]'),
  hint: query<HTMLElement>(root, '[data-hint]'),
});

export const wireSandbox = <T extends Activatable>(
  root: HTMLElement,
  create: (runtime: SandboxRuntime, common: CommonElements) => T,
) => {
  const common = commonElements(root);
  const { editButton, runButton, resetButton, staticBlock, host, status, hint } = common;

  let instance: T | undefined;
  let activating: Promise<T> | undefined;

  const activate = async (): Promise<T> => {
    editButton.disabled = true;
    runButton.disabled = true;
    status.className = 'ts-sandbox__status';
    status.textContent = `Loading the TypeScript ${TS_VERSION} editor…`;
    try {
      const runtime = await loadSandboxRuntime();
      ensureSiteTheme(runtime);
      host.hidden = false;
      const created = create(runtime, common);
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
