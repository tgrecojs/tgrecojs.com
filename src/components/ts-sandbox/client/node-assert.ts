// Browser-compatible Node assertions, loaded only when a snippet imports them.
export const NODE_ASSERT_URL = 'https://esm.sh/assert@2.1.0?bundle&target=es2022';

// The named assertion helpers supported by the editor's node:assert import.
export const NODE_ASSERT_TYPES = `
declare module 'node:assert' {
  export function strictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  export function deepStrictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
}
`;
