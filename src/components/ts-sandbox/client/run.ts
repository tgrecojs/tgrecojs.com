// Executes the editor's program in the page. The emitted JavaScript is loaded
// as a real ES module from a blob URL, so imports between the sandbox's files,
// top-level await and modern syntax all work. Each run gets its own `console`
// binding, injected as an import, so output is captured per run and the page's
// own console is never touched.

import type { TsNamespace } from './types';

export type OutputLevel = 'log' | 'info' | 'warn' | 'error';

export interface OutputLine {
  level: OutputLevel;
  text: string;
}

export interface RunResult {
  lines: OutputLine[];
  /** Set when the program threw or failed to load. */
  error?: string;
  durationMs: number;
}

type ConsoleShim = Record<OutputLevel | 'debug' | 'table' | 'dir', (...args: unknown[]) => void>;

const REGISTRY_KEY = '__tsSandboxConsoles';
const MAX_DEPTH = 3;
const TRANSPILE_OPTIONS = { module: 99, target: 99 }; // ESNext, ESNext

let runCounter = 0;

const registry = (): Record<string, ConsoleShim> => {
  const scope = globalThis as unknown as Record<string, Record<string, ConsoleShim> | undefined>;
  return (scope[REGISTRY_KEY] ??= {});
};

/**
 * Runs `mainJs` (the emitted JavaScript of the editor) together with the
 * sandbox's companion TypeScript `files`, keyed by file name. Lines of output
 * are reported through `onLine` as they happen and collected in the result.
 */
export const runProgram = async (
  ts: TsNamespace,
  mainJs: string,
  files: Record<string, string>,
  onLine: (line: OutputLine) => void,
): Promise<RunResult> => {
  const runId = `run-${++runCounter}`;
  const lines: OutputLine[] = [];
  const emit =
    (level: OutputLevel) =>
    (...args: unknown[]) => {
      const line = { level, text: args.map((arg) => format(arg)).join(' ') };
      lines.push(line);
      onLine(line);
    };
  registry()[runId] = {
    log: emit('log'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
    debug: emit('log'),
    table: emit('log'),
    dir: emit('log'),
  };

  const created: string[] = [];
  const blob = (source: string) => {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    created.push(url);
    return url;
  };

  const consoleUrl = blob(
    `export const console = globalThis[${JSON.stringify(REGISTRY_KEY)}][${JSON.stringify(runId)}];`,
  );
  const header = `import { console } from ${JSON.stringify(consoleUrl)};\n`;
  const moduleUrls: Record<string, string> = {};
  for (const [name, source] of Object.entries(files)) {
    const js = ts.transpileModule(source, { compilerOptions: TRANSPILE_OPTIONS, fileName: name }).outputText;
    moduleUrls[stripExtension(name)] = blob(header + rewriteImports(js, moduleUrls));
  }
  const mainUrl = blob(header + rewriteImports(mainJs, moduleUrls));

  const started = performance.now();
  try {
    await import(/* @vite-ignore */ mainUrl);
    // Let microtasks queued by the program (resolved promises) report before we finish.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { lines, durationMs: performance.now() - started };
  } catch (error) {
    return { lines, error: describeError(error), durationMs: performance.now() - started };
  } finally {
    delete registry()[runId];
    created.forEach((url) => URL.revokeObjectURL(url));
  }
};

/** Points relative imports (`./timer`, `./timer.ts`) at the blob URLs of the companion files. */
const rewriteImports = (js: string, moduleUrls: Record<string, string>) =>
  js.replace(/(\bfrom\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (whole, lead: string, quote: string, spec: string) => {
    const url = moduleUrls[stripExtension(spec.replace(/^\.{1,2}\//, ''))];
    return url ? `${lead}${quote}${url}${quote}` : whole;
  });

const stripExtension = (name: string) => name.replace(/\.(d\.ts|tsx?|m?js)$/, '');

const describeError = (error: unknown) => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
};

/** Prints a value the way the article's comments do: `{ status: 'running', remainingSeconds: 2 }`. */
export const format = (value: unknown, depth = 0, seen = new WeakSet<object>()): string => {
  if (typeof value === 'string') return depth === 0 ? value : quote(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (value === null || typeof value !== 'object') return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (seen.has(value)) return '[Circular]';
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  const inner = (item: unknown) => format(item, depth + 1, seen);
  if (Array.isArray(value)) return value.length ? `[ ${value.map(inner).join(', ')} ]` : '[]';
  if (value instanceof Map) {
    const entries = [...value].map(([k, v]) => `${inner(k)} => ${inner(v)}`);
    return `Map(${value.size}) {${entries.length ? ` ${entries.join(', ')} ` : ''}}`;
  }
  if (value instanceof Set) {
    const items = [...value].map(inner);
    return `Set(${value.size}) {${items.length ? ` ${items.join(', ')} ` : ''}}`;
  }
  const entries = Object.entries(value).map(([key, item]) => `${isIdentifier(key) ? key : quote(key)}: ${inner(item)}`);
  const name = value.constructor && value.constructor !== Object ? `${value.constructor.name} ` : '';
  return entries.length ? `${name}{ ${entries.join(', ')} }` : `${name}{}`;
};

const quote = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const isIdentifier = (key: string) => /^[A-Za-z_$][\w$]*$/.test(key);
