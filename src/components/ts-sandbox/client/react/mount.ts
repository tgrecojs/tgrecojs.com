// Entry point for <ReactSandbox>. Wires every instance on the page; the
// editor, React's types and the preview all load on the reader's first click.

import { wireSandbox } from '../activate';
import { parseFiles, query } from '../util';
import { createReactInstance } from './instance';

document.querySelectorAll<HTMLElement>('[data-react-sandbox]').forEach((root) => {
  const file = root.dataset.file ?? 'App.tsx';
  const source = {
    id: root.dataset.sandboxId ?? 'react-sandbox',
    title: root.dataset.title ?? 'React example',
    file,
    code: root.dataset.source ?? '',
    files: parseFiles(root.dataset.files),
    component: root.dataset.component ?? 'App',
    entryFile: root.dataset.entryFile ?? file,
  };
  const output = {
    panel: query<HTMLElement>(root, '[data-output]'),
    lines: query<HTMLElement>(root, '[data-output-lines]'),
    status: query<HTMLElement>(root, '[data-run-status]'),
  };
  const preview = {
    panel: query<HTMLElement>(root, '[data-preview]'),
    frame: query<HTMLElement>(root, '[data-preview-frame]'),
    status: query<HTMLElement>(root, '[data-preview-status]'),
  };
  wireSandbox(root, (runtime, { host, status, list, runButton }) =>
    createReactInstance(source, { root, host, status, list, runButton, output, preview }, runtime),
  );
});
