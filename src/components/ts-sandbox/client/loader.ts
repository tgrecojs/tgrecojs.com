// Loads Monaco, the TypeScript worker and the official TypeScript Sandbox from
// the TypeScript CDN, exactly once per page, using the AMD loader the Sandbox
// is published for. See https://www.typescriptlang.org/dev/sandbox/.

import { LOAD_TIMEOUT_MS, MONACO_VS_PATH, SANDBOX_PATH } from './config';
import type { AmdRequire, MonacoNamespace, SandboxFactory, SandboxRuntime, TsNamespace } from './types';

interface Globals {
  require?: AmdRequire;
  ts?: TsNamespace;
}

const globals = window as unknown as Globals;

let pending: Promise<SandboxRuntime> | undefined;

/**
 * Resolves with the shared runtime. A failed attempt clears the cache so the
 * next call ("Try again") really retries instead of replaying the rejection.
 */
export const loadSandboxRuntime = (): Promise<SandboxRuntime> => {
  pending ??= withTimeout(loadRuntime(), LOAD_TIMEOUT_MS).catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
};

const loadRuntime = async (): Promise<SandboxRuntime> => {
  await loadScript(`${MONACO_VS_PATH}/loader.js`);

  const amd = globals.require;
  if (!amd || typeof amd.config !== 'function') {
    throw new Error('the Monaco loader did not initialise');
  }

  amd.config({
    paths: { vs: MONACO_VS_PATH, sandbox: SANDBOX_PATH },
    ignoreDuplicateModules: ['vs/editor/editor.main'],
  });

  const [monaco, , sandboxFactory] = await amdRequire(amd, [
    'vs/editor/editor.main',
    'vs/language/typescript/tsWorker',
    'sandbox/index',
  ]);
  const ts = globals.ts;

  if (!isMonaco(monaco) || !ts || !isSandboxFactory(sandboxFactory)) {
    throw new Error('the TypeScript Sandbox did not load completely');
  }
  return { monaco, ts, sandboxFactory };
};

const amdRequire = (amd: AmdRequire, modules: string[]) =>
  new Promise<unknown[]>((resolve, reject) => {
    amd(modules, (...exports) => resolve(exports), reject);
  });

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }
    const script = existing ?? document.createElement('script');
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error(`could not download ${src}`));
      },
      { once: true },
    );
    if (!existing) {
      script.src = src;
      script.async = true;
      document.head.append(script);
    }
  });

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms);
    promise.then(resolve, reject).finally(() => window.clearTimeout(timer));
  });

const isMonaco = (value: unknown): value is MonacoNamespace =>
  typeof value === 'object' && value !== null && 'editor' in value && 'Uri' in value;

const isSandboxFactory = (value: unknown): value is SandboxFactory =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SandboxFactory).createTypeScriptSandbox === 'function';
