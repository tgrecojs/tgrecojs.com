// Minimal structural types for the parts of Monaco, TypeScript and the
// TypeScript Sandbox this component touches. All three load from the
// TypeScript CDN at runtime, so there is no package to take types from;
// keeping these narrow also documents exactly which APIs are relied on.

import type { ComponentProps } from 'astro/types';
import type { Code } from 'astro:components';

type CodeProps = ComponentProps<typeof Code>;

export type Scheme = 'light' | 'dark';

export interface EditorPalette {
  background: string;
  foreground: string;
  lineNumber: string;
  selection: string;
  error: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  type: string;
}

export interface SiteConfig {
  /** Props for Astro's <Code>, so the static block matches the site's other code blocks. */
  shiki: Pick<CodeProps, 'theme' | 'themes' | 'defaultColor'>;
  editor: {
    /** 'auto' follows prefers-color-scheme and <html data-theme>; otherwise the scheme is fixed. */
    scheme: Scheme | 'auto';
    fontFamily: string;
    palette: Record<Scheme, EditorPalette>;
  };
}

export interface MonacoUri {
  path: string;
  toString(): string;
}

export interface MonacoPosition {
  lineNumber: number;
  column: number;
}

export interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoDisposable {
  dispose(): void;
}

export interface MonacoModel {
  uri: MonacoUri;
  getValue(): string;
  getPositionAt(offset: number): MonacoPosition;
  getFullModelRange(): MonacoRange;
  pushStackElement(): void;
  pushEditOperations(before: null, edits: { range: MonacoRange; text: string }[], after: () => null): void;
  dispose(): void;
}

export interface MonacoEditor {
  getModel(): MonacoModel | null;
  focus(): void;
  layout(): void;
  getContentHeight(): number;
  setPosition(position: MonacoPosition): void;
  revealPositionInCenter(position: MonacoPosition): void;
  addCommand(keybinding: number, handler: () => void): string | null;
  onDidChangeModelContent(listener: () => void): MonacoDisposable;
  onDidContentSizeChange(listener: () => void): MonacoDisposable;
}

export interface MonacoThemeRule {
  token: string;
  foreground?: string;
  fontStyle?: string;
}

export interface MonacoTheme {
  base: 'vs' | 'vs-dark';
  inherit: boolean;
  rules: MonacoThemeRule[];
  colors: Record<string, string>;
}

export interface MonacoEditorApi {
  create(element: HTMLElement, options: Record<string, unknown>): MonacoEditor;
  createModel(value: string, language?: string, uri?: MonacoUri): MonacoModel;
  getModel(uri: MonacoUri): MonacoModel | null;
  defineTheme(name: string, theme: MonacoTheme): void;
  setTheme(name: string): void;
  remeasureFonts(): void;
}

export interface MonacoNamespace {
  Uri: { file(path: string): MonacoUri };
  editor: MonacoEditorApi;
  KeyMod: { CtrlCmd: number };
  KeyCode: { Enter: number };
}

export interface TsMessageChain {
  messageText: string;
  next?: TsMessageChain[];
}

export interface TsDiagnostic {
  code: number;
  category: number;
  start?: number;
  length?: number;
  messageText: string | TsMessageChain;
}

export interface TsNamespace {
  version: string;
  DiagnosticCategory: { Warning: number; Error: number; Suggestion: number; Message: number };
  flattenDiagnosticMessageText(message: string | TsMessageChain | undefined, newLine: string): string;
  transpileModule(
    input: string,
    options: { compilerOptions: Record<string, unknown>; fileName?: string; reportDiagnostics?: boolean },
  ): { outputText: string; diagnostics?: TsDiagnostic[] };
}

export interface TsWorkerClient {
  getSyntacticDiagnostics(uri: string): Promise<TsDiagnostic[]>;
  getSemanticDiagnostics(uri: string): Promise<TsDiagnostic[]>;
}

export interface SandboxConfig {
  text: string;
  elementToAppend: HTMLElement;
  filetype: 'ts' | 'js' | 'd.ts';
  compilerOptions: Record<string, unknown>;
  acquireTypes: boolean;
  supportTwoslashCompilerOptions: boolean;
  suppressAutomaticallyGettingDefaultText: boolean;
  suppressAutomaticallyGettingCompilerFlags: boolean;
  logger: { log: (...args: unknown[]) => void };
  monacoSettings: Record<string, unknown>;
}

export interface Sandbox {
  editor: MonacoEditor;
  getModel(): MonacoModel;
  getText(): string;
  setText(text: string): void;
  getWorkerProcess(): Promise<TsWorkerClient>;
  getRunnableJS(): Promise<string>;
  getCompilerOptions(): Record<string, unknown>;
  languageServiceDefaults: { addExtraLib(content: string, filePath: string): MonacoDisposable };
}

export interface SandboxFactory {
  createTypeScriptSandbox(config: Partial<SandboxConfig>, monaco: MonacoNamespace, ts: TsNamespace): Sandbox;
}

export interface SandboxRuntime {
  monaco: MonacoNamespace;
  ts: TsNamespace;
  sandboxFactory: SandboxFactory;
}

export interface AmdRequire {
  (modules: string[], onLoad: (...exports: unknown[]) => void, onError?: (error: unknown) => void): void;
  config(options: Record<string, unknown>): void;
}
