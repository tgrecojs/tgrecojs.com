// Where the TypeScript Sandbox and its Monaco build come from, and how the
// compiler is configured. TS_VERSION must match the `typescript` package the
// site builds with, so the editor reports the same diagnostics as `astro check`.

export const TS_VERSION = '5.9.3';

export const MONACO_VS_PATH = `https://playgroundcdn.typescriptlang.org/cdn/${TS_VERSION}/monaco/min/vs`;
export const SANDBOX_PATH = 'https://www.typescriptlang.org/js/sandbox';

/** Give up on a load after this long and show the error state. */
export const LOAD_TIMEOUT_MS = 45_000;

/** Wait this long after the last keystroke before re-checking. */
export const CHECK_DEBOUNCE_MS = 250;

// Mirrors astro/tsconfigs/strict for the options that affect diagnostics.
// Enum members are passed as their numeric values because the enums live in
// the Monaco bundle, which is not loaded when this module is evaluated.
// `moduleDetection: force` (3) makes every editor its own module, so two
// sandboxes on one page can each declare `TimerState` without a clash.
export const compilerOptions = {
  strict: true,
  target: 99, // ScriptTarget.ESNext
  module: 99, // ModuleKind.ESNext
  moduleDetection: 3, // ModuleDetectionKind.Force
  jsx: 0, // JsxEmit.None
  esModuleInterop: true,
  skipLibCheck: true,
  declaration: false,
  noImplicitReturns: false,
  noUnusedLocals: false,
  noUnusedParameters: false,
  experimentalDecorators: false,
  emitDecoratorMetadata: false,
  useDefineForClassFields: true,
};
