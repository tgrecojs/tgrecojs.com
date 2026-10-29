// Fetches React's type definitions once per page and registers them with the
// TypeScript worker, so `import { useReducer } from 'react'` type-checks in
// every ReactSandbox editor. A failed attempt clears the cache so the next
// editor to open retries.

import type { Sandbox } from '../types';
import { typeFiles } from './config';

type Defaults = Sandbox['languageServiceDefaults'];

let pending: Promise<void> | undefined;

export const loadReactTypes = (defaults: Defaults): Promise<void> => {
  pending ??= fetchAll()
    .then((entries) => {
      for (const [path, content] of entries) defaults.addExtraLib(content, `file://${path}`);
    })
    .catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
  return pending;
};

const fetchAll = () =>
  Promise.all(
    typeFiles.map(async ({ path, url }): Promise<[string, string]> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url} answered ${response.status}`);
      return [path, await response.text()];
    }),
  );
