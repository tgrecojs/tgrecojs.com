// One ReactSandbox editor: the shared editor from editor.ts, React's type
// definitions for diagnostics, and a live preview in place of TsSandbox's
// Run. Run (or Ctrl/Cmd+Enter) compiles the edited file and its companions
// and mounts the chosen component in the preview frame; once a preview is up,
// edits re-render it after a short pause.

import { siteConfig } from '../../site-config';
import type { ReadableDiagnostic } from '../diagnostics';
import { createEditor, type EditorElements } from '../editor';
import { appendLine, clearOutput, type OutputView } from '../output';
import { format, rewriteImports, stripExtension } from '../run';
import { currentScheme, watchScheme } from '../theme';
import type { SandboxRuntime } from '../types';
import { describe } from '../util';
import { PREVIEW_TIMEOUT_MS, REACT_VERSION, RENDER_DEBOUNCE_MS, transpileOptions } from './config';
import { createPreview, readTheme, type PreviewEvent } from './preview';
import { loadReactTypes } from './react-types';

export interface ReactSource {
  id: string;
  title: string;
  /** The edited file's name, e.g. "TimerView.tsx". Companions may import it. */
  file: string;
  code: string;
  /** Companion files, keyed by file name (e.g. "timer.ts", "Timer.tsx"). */
  files: Record<string, string>;
  /** Exported component to mount. */
  component: string;
  /** File that exports it; the edited file or a companion. */
  entryFile: string;
}

export interface PreviewElements {
  panel: HTMLElement;
  frame: HTMLElement;
  status: HTMLElement;
}

export interface ReactElements extends EditorElements {
  root: HTMLElement;
  runButton: HTMLButtonElement;
  output: OutputView;
  preview: PreviewElements;
}

export interface ReactInstance {
  check: () => Promise<ReadableDiagnostic[]>;
  /** Compiles everything and (re)mounts the component in the preview. */
  run: () => Promise<void>;
  /** Restores the original source, then re-renders if a preview is showing. */
  reset: () => Promise<ReadableDiagnostic[]>;
  focus: () => void;
}

type StatusKind = 'ok' | 'error';

export const createReactInstance = (
  source: ReactSource,
  elements: ReactElements,
  runtime: SandboxRuntime,
): ReactInstance => {
  const { monaco, ts } = runtime;
  let typesFailed = false;
  let typesReady: Promise<void> | undefined;

  const handle = createEditor(source, elements, runtime, {
    folderPrefix: 'react-sandbox',
    beforeCheck: () => typesReady ?? Promise.resolve(),
    statusNote: () =>
      typesFailed ? "React's type definitions could not load, so errors about 'react' are expected here." : undefined,
  });

  typesReady = loadReactTypes(handle.sandbox.languageServiceDefaults).catch((error: unknown) => {
    typesFailed = true;
    console.error('[ReactSandbox] type definitions', error);
  });

  const preview = createPreview(elements.preview.frame, `Live preview of ${source.title}`);
  watchScheme(siteConfig.editor, (scheme) => preview.setTheme(readTheme(elements.root, scheme)));

  let live = false;
  let lastKind: StatusKind | undefined;
  const setStatus = (text: string, kind: StatusKind, quiet = false) => {
    // Quiet re-renders only speak up when something changes, so the live
    // region does not announce every keystroke.
    if (quiet && kind === 'ok' && lastKind === 'ok') return;
    lastKind = kind;
    elements.preview.status.textContent = text;
    elements.preview.status.classList.toggle('ts-sandbox__output-status--error', kind === 'error');
  };

  /** Compiles the edited file and its companions, or reports the first syntax error. */
  const compile = (): { modules: Record<string, string> } | { error: string } => {
    const sources = { ...source.files, [source.file]: handle.model.getValue() };
    const names = Object.fromEntries(Object.keys(sources).map((file) => [stripExtension(file), `sandbox:${stripExtension(file)}`]));
    const modules: Record<string, string> = {};
    for (const [file, text] of Object.entries(sources)) {
      const result = ts.transpileModule(text, { compilerOptions: transpileOptions, fileName: file, reportDiagnostics: true });
      const failure = result.diagnostics?.find((d) => d.category === ts.DiagnosticCategory.Error);
      if (failure) return { error: `${file}: ${ts.flattenDiagnosticMessageText(failure.messageText, ' ')}` };
      modules[stripExtension(file)] = `${rewriteImports(result.outputText, names)}\n//# sourceURL=sandbox:${file}`;
    }
    return { modules };
  };

  const onEvent = (quiet: boolean) => (event: PreviewEvent) => {
    switch (event.kind) {
      case 'ready':
        setStatus(quiet ? 'Preview updated.' : `Rendered in ${Math.max(1, Math.round(event.durationMs))} ms.`, 'ok', quiet);
        break;
      case 'error':
        setStatus(
          event.phase === 'load' && live
            ? `Runtime error: ${event.message} The preview shows the last version that rendered.`
            : `Runtime error: ${event.message}`,
          'error',
        );
        break;
      case 'timeout':
        setStatus(
          `The preview did not load within ${PREVIEW_TIMEOUT_MS / 1000} seconds. Check your connection, then run again.`,
          'error',
        );
        break;
      case 'console':
        appendLine(elements.output, { level: event.level, text: event.args.map((arg) => format(arg)).join(' ') });
        elements.output.status.textContent = 'From the preview’s console.';
        break;
    }
  };

  let rendered = false;
  const render = (quiet = false) => {
    elements.preview.panel.hidden = false;
    const compiled = compile();
    if ('error' in compiled) {
      setStatus(`Fix this syntax error to update the preview. ${compiled.error}`, 'error');
      return;
    }
    clearOutput(elements.output);
    if (!quiet) setStatus(rendered ? 'Rendering…' : `Loading React ${REACT_VERSION}…`, 'ok');
    preview.render(
      {
        modules: compiled.modules,
        entryFile: source.entryFile,
        component: source.component,
        theme: readTheme(elements.root, currentScheme(siteConfig.editor)),
      },
      (event) => {
        if (event.kind === 'ready') {
          rendered = true;
          live = true;
        }
        onEvent(quiet)(event);
      },
    );
  };

  let renderTimer: number | undefined;
  handle.onDidChange(() => {
    if (!live) return;
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => render(true), RENDER_DEBOUNCE_MS);
  });

  const run = async () => {
    try {
      render();
    } catch (error) {
      setStatus(`Could not compile: ${describe(error)}`, 'error');
    }
  };

  handle.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void run());

  const reset = async () => {
    const items = await handle.reset();
    window.clearTimeout(renderTimer);
    clearOutput(elements.output);
    if (live) render();
    return items;
  };

  return { check: handle.check, run, reset, focus: handle.focus };
};
