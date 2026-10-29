// One editor. Creates a TypeScript Sandbox in the host element with its own
// virtual file, and exposes check (run diagnostics) and reset (restore the
// original source). Instances share the runtime but nothing else.

import { siteConfig } from '../site-config';
import { CHECK_DEBOUNCE_MS, compilerOptions } from './config';
import { renderDiagnostics, toReadable, type ReadableDiagnostic } from './diagnostics';
import type { MonacoEditor, MonacoEditorApi, MonacoNamespace, MonacoUri, Sandbox, SandboxRuntime } from './types';

export interface SandboxInstance {
  sandbox: Sandbox;
  /** Runs syntactic and semantic checking and re-renders the diagnostics list. */
  check: () => Promise<ReadableDiagnostic[]>;
  /** Restores the original source (undoable with Ctrl/Cmd+Z) and re-checks. */
  reset: () => Promise<ReadableDiagnostic[]>;
  focus: () => void;
}

export interface InstanceElements {
  host: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
}

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 720;
const SCROLLBAR_ALLOWANCE = 10;

export const createSandboxInstance = (
  id: string,
  title: string,
  source: string,
  elements: InstanceElements,
  runtime: SandboxRuntime,
): SandboxInstance => {
  const { monaco, ts, sandboxFactory } = runtime;
  const uri = monaco.Uri.file(`/ts-sandbox/${id}.ts`);
  monaco.editor.getModel(uri)?.dispose();

  const sandbox = sandboxFactory.createTypeScriptSandbox(
    {
      text: source,
      elementToAppend: elements.host,
      filetype: 'ts',
      compilerOptions,
      acquireTypes: false,
      supportTwoslashCompilerOptions: false,
      suppressAutomaticallyGettingDefaultText: true,
      suppressAutomaticallyGettingCompilerFlags: true,
      logger: { log: () => {} },
      monacoSettings: editorSettings(title),
    },
    isolatedMonaco(monaco, uri),
    ts,
  );

  const { editor } = sandbox;
  const model = sandbox.getModel();
  const view = { status: elements.status, list: elements.list };

  fitHeight(editor, elements.host);
  editor.onDidContentSizeChange(() => fitHeight(editor, elements.host));

  const jumpTo = (item: ReadableDiagnostic) => {
    const position = { lineNumber: item.line, column: item.column };
    editor.setPosition(position);
    editor.revealPositionInCenter(position);
    editor.focus();
  };

  let generation = 0;
  const check = async () => {
    const run = ++generation;
    elements.status.textContent = 'Checking…';
    try {
      const client = await sandbox.getWorkerProcess();
      const file = model.uri.toString();
      const [syntactic, semantic] = await Promise.all([
        client.getSyntacticDiagnostics(file),
        client.getSemanticDiagnostics(file),
      ]);
      const items = toReadable(ts, model, [...syntactic, ...semantic]);
      if (run === generation) renderDiagnostics(view, items, jumpTo);
      return items;
    } catch (error) {
      if (run === generation) {
        elements.status.textContent = `Could not check this code: ${describe(error)}`;
        elements.status.classList.add('ts-sandbox__status--error');
      }
      throw error;
    }
  };

  let timer: number | undefined;
  editor.onDidChangeModelContent(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void check().catch(() => {}), CHECK_DEBOUNCE_MS);
  });

  const reset = () => {
    model.pushStackElement();
    model.pushEditOperations(null, [{ range: model.getFullModelRange(), text: source }], () => null);
    model.pushStackElement();
    editor.setPosition({ lineNumber: 1, column: 1 });
    window.clearTimeout(timer);
    return check();
  };

  return { sandbox, check, reset, focus: () => editor.focus() };
};

/**
 * The Sandbox always names its file `input.ts`, and Monaco refuses a second
 * model at the same path. This facade gives each instance its own path and
 * keeps the Sandbox's bundled theme from overriding the site's.
 */
const isolatedMonaco = (monaco: MonacoNamespace, uri: MonacoUri): MonacoNamespace => {
  // The AMD exports expose their members through getters, so the overrides
  // are defined as own properties rather than assigned.
  const createModel: MonacoEditorApi['createModel'] = (value, language) =>
    monaco.editor.createModel(value, language, uri);
  const setTheme: MonacoEditorApi['setTheme'] = () => {};
  const editor = Object.create(monaco.editor) as MonacoEditorApi;
  Object.defineProperties(editor, {
    createModel: { value: createModel },
    setTheme: { value: setTheme },
  });
  const facade = Object.create(monaco) as MonacoNamespace;
  Object.defineProperty(facade, 'editor', { value: editor });
  return facade;
};

const editorSettings = (title: string): Record<string, unknown> => ({
  ariaLabel: `${title}, TypeScript editor`,
  automaticLayout: true,
  fontFamily: siteConfig.editor.fontFamily,
  fontSize: 14,
  lineHeight: 22,
  tabSize: 2,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  scrollBeyondLastColumn: 2,
  scrollbar: { alwaysConsumeMouseWheel: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  renderLineHighlight: 'none',
  occurrencesHighlight: 'off',
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  folding: false,
  glyphMargin: false,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 8,
  padding: { top: 12, bottom: 12 },
  wordWrap: 'off',
  inlayHints: { enabled: 'off' },
  lightbulb: { enabled: 'onCode' },
  stickyScroll: { enabled: false },
  fixedOverflowWidgets: true,
});

/** Grows the host with the content so short examples never scroll inside the page. */
const fitHeight = (editor: MonacoEditor, host: HTMLElement) => {
  const wanted = editor.getContentHeight() + SCROLLBAR_ALLOWANCE;
  host.style.height = `${Math.min(Math.max(wanted, MIN_HEIGHT), MAX_HEIGHT)}px`;
  editor.layout();
};

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));
