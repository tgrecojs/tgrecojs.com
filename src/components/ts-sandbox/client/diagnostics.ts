// Turns the TypeScript worker's diagnostics into readable entries and renders
// them under the editor. Monaco draws the squiggles itself; this list is the
// same information in prose, with a button per entry that jumps to the spot.

import type { MonacoModel, TsDiagnostic, TsNamespace } from './types';

export type Severity = 'error' | 'warning';

export interface ReadableDiagnostic {
  /** e.g. "TS2322" */
  code: string;
  message: string;
  line: number;
  column: number;
  severity: Severity;
}

export interface DiagnosticsView {
  status: HTMLElement;
  list: HTMLElement;
}

export const toReadable = (
  ts: TsNamespace,
  model: MonacoModel,
  diagnostics: TsDiagnostic[],
): ReadableDiagnostic[] =>
  diagnostics
    .filter((d) => d.category === ts.DiagnosticCategory.Error || d.category === ts.DiagnosticCategory.Warning)
    .map((d) => {
      const position = model.getPositionAt(d.start ?? 0);
      return {
        code: `TS${d.code}`,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
        line: position.lineNumber,
        column: position.column,
        severity: d.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
      } satisfies ReadableDiagnostic;
    })
    .sort((a, b) => a.line - b.line || a.column - b.column);

export const summarize = (items: ReadableDiagnostic[]) => {
  const errors = items.filter((item) => item.severity === 'error').length;
  const warnings = items.length - errors;
  if (items.length === 0) return 'No errors. TypeScript accepts this code.';
  const parts = [];
  if (errors) parts.push(`${errors} ${errors === 1 ? 'error' : 'errors'}`);
  if (warnings) parts.push(`${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`);
  return `${parts.join(' and ')} found.`;
};

export const renderDiagnostics = (
  view: DiagnosticsView,
  items: ReadableDiagnostic[],
  onSelect: (item: ReadableDiagnostic) => void,
) => {
  view.list.replaceChildren(...items.map((item) => renderItem(item, onSelect)));
  view.list.hidden = items.length === 0;
  view.status.textContent = summarize(items);
  view.status.classList.toggle('ts-sandbox__status--error', items.some((item) => item.severity === 'error'));
  view.status.classList.toggle('ts-sandbox__status--ok', items.length === 0);
};

const renderItem = (item: ReadableDiagnostic, onSelect: (item: ReadableDiagnostic) => void) => {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `ts-sandbox__diagnostic ts-sandbox__diagnostic--${item.severity}`;
  button.title = 'Jump to this line in the editor';
  button.append(
    span('ts-sandbox__diagnostic-code', item.code),
    span('ts-sandbox__diagnostic-where', `line ${item.line}:${item.column}`),
    span('ts-sandbox__diagnostic-message', item.message),
  );
  button.addEventListener('click', () => onSelect(item));
  li.append(button);
  return li;
};

const span = (className: string, text: string) => {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
};
