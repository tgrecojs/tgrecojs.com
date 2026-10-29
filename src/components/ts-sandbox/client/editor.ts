// One Monaco editor backed by the TypeScript Sandbox, shared by TsSandbox and
// ReactSandbox. It owns the editor's virtual folder (the edited file plus any
// companion files), live diagnostics, Reset, and sizing. What happens on Run
// (execute in the page, or render in a preview frame) is layered on top by
// each component's instance module.

import { siteConfig } from '../site-config';
import { CHECK_DEBOUNCE_MS, compilerOptions } from './config';
import { renderDiagnostics, toReadable, type ReadableDiagnostic } from './diagnostics';
import type { MonacoEditor, MonacoEditorApi, MonacoModel, MonacoNamespace, MonacoUri, Sandbox, SandboxRuntime } from './types';
import { describe } from './util';

export interface EditorSource {
  /** Unique on the page; names the virtual folder. */
  id: string;
  title: string;
  /** Name of the file in the editor, e.g. "index.ts" or "TimerView.tsx". Companions may import it. */
  file: string;
  code: string;
  /** Companion files the editor may import, keyed by file name (e.g. "timer.ts"). */
  files: Record<string, string>;
}

export interface EditorElements {
  host: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
}

export interface EditorOptions {
  /** Prefix of the virtual folder, so two components never share a path. */
  folderPrefix: string;
  /** Awaited before each check, e.g. to wait for type definitions to arrive. */
  beforeCheck?: () => Promise<void>;
  /** Extra sentence appended to the diagnostics summary, e.g. a note that type definitions failed to load. */
  statusNote?: () => string | undefined;
}

export interface EditorHandle {
  sandbox: Sandbox;
  editor: MonacoEditor;
  model: MonacoModel;
  /** Runs syntactic and semantic checking and re-renders the diagnostics list. */
  check: () => Promise<ReadableDiagnostic[]>;
  /** Restores the original source (undoable with Ctrl/Cmd+Z) and re-checks. */
  reset: () => Promise<ReadableDiagnostic[]>;
  focus: () => void;
  /** The diagnostics from the most recent check. */
  diagnostics: () => ReadableDiagnostic[];
  /** Called on every content change, before the debounced re-check. */
  onDidChange: (listener: () => void) => void;
}

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 720;
const SCROLLBAR_ALLOWANCE = 10;

export const createEditor = (
  source: EditorSource,
  elements: EditorElements,
  runtime: SandboxRuntime,
  options: EditorOptions,
): EditorHandle => {
  const { monaco, ts, sandboxFactory } = runtime;
  const folder = `/${options.folderPrefix}/${source.id}`;
  const uri = monaco.Uri.file(`${folder}/${source.file}`);
  monaco.editor.getModel(uri)?.dispose();

  const sandbox = sandboxFactory.createTypeScriptSandbox(
    {
      text: source.code,
      elementToAppend: elements.host,
      filetype: 'ts',
      compilerOptions,
      acquireTypes: false,
      supportTwoslashCompilerOptions: false,
      suppressAutomaticallyGettingDefaultText: true,
      suppressAutomaticallyGettingCompilerFlags: true,
      logger: { log: () => {} },
      monacoSettings: editorSettings(source.title),
    },
    isolatedMonaco(monaco, uri),
    ts,
  );

  for (const [name, content] of Object.entries(source.files)) {
    sandbox.languageServiceDefaults.addExtraLib(content, `file://${folder}/${name}`);
  }

  const { editor } = sandbox;
  const model = sandbox.getModel();
  const view = { status: elements.status, list: elements.list };
  let lastDiagnostics: ReadableDiagnostic[] = [];
  const listeners: (() => void)[] = [];

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
      await options.beforeCheck?.();
      const client = await sandbox.getWorkerProcess();
      const file = model.uri.toString();
      const [syntactic, semantic] = await Promise.all([
        client.getSyntacticDiagnostics(file),
        client.getSemanticDiagnostics(file),
      ]);
      const items = toReadable(ts, model, [...syntactic, ...semantic]);
      if (run === generation) {
        lastDiagnostics = items;
        renderDiagnostics(view, items, jumpTo);
        const note = options.statusNote?.();
        if (note) elements.status.textContent += ` ${note}`;
      }
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
    listeners.forEach((listener) => listener());
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void check().catch(() => {}), CHECK_DEBOUNCE_MS);
  });

  const reset = () => {
    model.pushStackElement();
    model.pushEditOperations(null, [{ range: model.getFullModelRange(), text: source.code }], () => null);
    model.pushStackElement();
    editor.setPosition({ lineNumber: 1, column: 1 });
    window.clearTimeout(timer);
    return check();
  };

  return {
    sandbox,
    editor,
    model,
    check,
    reset,
    focus: () => editor.focus(),
    diagnostics: () => lastDiagnostics,
    onDidChange: (listener) => listeners.push(listener),
  };
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
