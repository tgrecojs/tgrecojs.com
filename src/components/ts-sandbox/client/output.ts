// Renders a run's console output under the editor.

import type { OutputLine, RunResult } from './run';

export interface OutputView {
  panel: HTMLElement;
  lines: HTMLElement;
  status: HTMLElement;
}

export const clearOutput = (view: OutputView) => {
  view.lines.replaceChildren();
  view.status.textContent = '';
  view.panel.hidden = true;
};

export const showRunning = (view: OutputView) => {
  view.lines.replaceChildren();
  view.status.textContent = 'Running…';
  view.panel.hidden = false;
};

export const appendLine = (view: OutputView, line: OutputLine) => {
  const element = document.createElement('div');
  element.className = `ts-sandbox__output-line ts-sandbox__output-line--${line.level}`;
  element.textContent = line.text;
  view.lines.append(element);
  view.panel.hidden = false;
};

export const showRunResult = (view: OutputView, result: RunResult, typeErrors: number) => {
  if (result.error) appendLine(view, { level: 'error', text: result.error });
  const count = result.lines.length;
  const parts = [];
  if (result.error) parts.push('Stopped with an error.');
  else if (count === 0) parts.push('Ran with no output. Use console.log to print a value.');
  else parts.push(`Ran in ${Math.max(1, Math.round(result.durationMs))} ms.`);
  if (typeErrors > 0) {
    parts.push(
      `TypeScript reported ${typeErrors} ${typeErrors === 1 ? 'error' : 'errors'} above, but JavaScript runs anyway: types are checked, not enforced.`,
    );
  }
  view.status.textContent = parts.join(' ');
  view.status.classList.toggle('ts-sandbox__output-status--error', Boolean(result.error));
  view.panel.hidden = false;
};
