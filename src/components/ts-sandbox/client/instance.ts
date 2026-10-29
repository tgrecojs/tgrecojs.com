// One editor. Creates a TypeScript Sandbox in the host element with its own
// virtual folder (the editor's file plus any companion files), and exposes
// check (run diagnostics), run (execute the program) and reset (restore the
// original source). Instances share the runtime but nothing else.

import { siteConfig } from '../site-config';
import { CHECK_DEBOUNCE_MS, compilerOptions } from './config';
import { renderDiagnostics, toReadable, type ReadableDiagnostic } from './diagnostics';
import { appendLine, clearOutput, showRunResult, showRunning, type OutputView } from './output';
import { runProgram } from './run';
import type { MonacoEditor, MonacoEditorApi, MonacoNamespace, MonacoUri, Sandbox, SandboxRuntime } from './types';

export interface SandboxInstance {
  sandbox: Sandbox;
  /** Runs syntactic and semantic checking and re-renders the diagnostics list. */
  check: () => Promise<ReadableDiagnostic[]>;
  /** Compiles the program and executes it, streaming console output under the editor. */
  run: () => Promise<void>;
  /** Restores the original source (undoable with Ctrl/Cmd+Z), clears output and re-checks. */
  reset: () => Promise<ReadableDiagnostic[]>;
  focus: () => void;
}

export interface InstanceElements {
  host: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  output: OutputView;
  runButton: HTMLButtonElement;
}

export interface InstanceSource {
  id: string;
  title: string;
  code: string;
  /** Companion TypeScript files the editor may import, keyed by file name (e.g. "timer.ts"). */
  files: Record<string, string>;
}

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 720;
const SCROLLBAR_ALLOWANCE = 10;

export const createSandboxInstance = (
  source: InstanceSource,
  elements: InstanceElements,
  runtime: SandboxRuntime,
): SandboxInstance => {
  const { monaco, ts, sandboxFactory } = runtime;
  const folder = `/ts-sandbox/${source.id}`;
  const uri = monaco.Uri.file(`${folder}/index.ts`);
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
      if (run === generation) {
        lastDiagnostics = items;
        renderDiagnostics(view, items, jumpTo);
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
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void check().catch(() => {}), CHECK_DEBOUNCE_MS);
  });

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    elements.runButton.disabled = true;
    showRunning(elements.output);
    try {
      const js = await sandbox.getRunnableJS();
      const result = await runProgram(ts, js, source.files, (line) => appendLine(elements.output, line));
      const typeErrors = lastDiagnostics.filter((item) => item.severity === 'error').length;
      showRunResult(elements.output, result, typeErrors);
    } catch (error) {
      showRunResult(elements.output, { lines: [], error: `Could not compile: ${describe(error)}`, durationMs: 0 }, 0);
    } finally {
      running = false;
      elements.runButton.disabled = false;
    }
  };

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void run());

  const reset = () => {
    model.pushStackElement();
    model.pushEditOperations(null, [{ range: model.getFullModelRange(), text: source.code }], () => null);
    model.pushStackElement();
    editor.setPosition({ lineNumber: 1, column: 1 });
    window.clearTimeout(timer);
    clearOutput(elements.output);
    return check();
  };

  return { sandbox, check, run, reset, focus: () => editor.focus() };
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
