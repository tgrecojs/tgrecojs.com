// One TsSandbox editor: the shared editor from editor.ts plus Run, which
// compiles the program and executes it in the page, streaming console output
// under the editor. Instances share the runtime but nothing else.

import { createEditor } from './editor';
import type { ReadableDiagnostic } from './diagnostics';
import { appendLine, clearOutput, showRunResult, showRunning, type OutputView } from './output';
import { runProgram } from './run';
import type { Sandbox, SandboxRuntime } from './types';
import { describe } from './util';

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

export const createSandboxInstance = (
  source: InstanceSource,
  elements: InstanceElements,
  runtime: SandboxRuntime,
): SandboxInstance => {
  const { monaco, ts } = runtime;
  const handle = createEditor({ ...source, file: 'index.ts' }, elements, runtime, { folderPrefix: 'ts-sandbox' });
  const { sandbox, editor } = handle;

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    elements.runButton.disabled = true;
    showRunning(elements.output);
    try {
      const js = await sandbox.getRunnableJS();
      const result = await runProgram(ts, js, source.files, (line) => appendLine(elements.output, line));
      const typeErrors = handle.diagnostics().filter((item) => item.severity === 'error').length;
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
    clearOutput(elements.output);
    return handle.reset();
  };

  return { sandbox, check: handle.check, run, reset, focus: handle.focus };
};
