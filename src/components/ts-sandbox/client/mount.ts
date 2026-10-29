// Entry point for <TsSandbox>. Wires every instance on the page; the editor
// itself loads when a reader presses "Edit this code" or "Run".

import { wireSandbox } from './activate';
import { createSandboxInstance } from './instance';
import { parseFiles, query } from './util';

document.querySelectorAll<HTMLElement>('[data-ts-sandbox]').forEach((root) => {
  const source = {
    id: root.dataset.sandboxId ?? 'sandbox',
    title: root.dataset.title ?? 'TypeScript example',
    code: root.dataset.source ?? '',
    files: parseFiles(root.dataset.files),
  };
  const output = {
    panel: query<HTMLElement>(root, '[data-output]'),
    lines: query<HTMLElement>(root, '[data-output-lines]'),
    status: query<HTMLElement>(root, '[data-run-status]'),
  };
  wireSandbox(root, (runtime, { host, status, list, runButton }) =>
    createSandboxInstance(source, { host, status, list, output, runButton }, runtime),
  );
});
