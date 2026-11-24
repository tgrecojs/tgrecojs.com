import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const toModuleUrl = (source) => {
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
};

const client = new URL('../src/components/ts-sandbox/client/', import.meta.url);
const assertUrl = toModuleUrl(await readFile(new URL('node-assert.ts', client), 'utf8'));
const runner = await readFile(new URL('run.ts', client), 'utf8');
const { rewriteImports } = await import(toModuleUrl(runner.replace("'./node-assert'", JSON.stringify(assertUrl))));
const { NODE_ASSERT_URL } = await import(assertUrl);

test('sandbox resolves Node assertions alongside companion imports', () => {
  const source = "import { strictEqual } from 'node:assert';\nimport { pipe2 } from './pipe2';";
  assert.equal(
    rewriteImports(source, { pipe2: 'blob:pipe2' }),
    `import { strictEqual } from '${NODE_ASSERT_URL}';\nimport { pipe2 } from 'blob:pipe2';`,
  );
});

test('sandbox preserves unknown imports and resolves existing companion file extensions', () => {
  const source = "import './missing';\nimport React from 'react';\nimport { pipe2 } from './pipe2.ts';";
  assert.equal(
    rewriteImports(source, { pipe2: 'blob:pipe2' }),
    "import './missing';\nimport React from 'react';\nimport { pipe2 } from 'blob:pipe2';",
  );
});
