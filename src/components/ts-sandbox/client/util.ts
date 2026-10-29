// Small helpers shared by the TsSandbox and ReactSandbox client code.

/** Finds a required element under `root`, or throws naming the selector. */
export const query = <T extends HTMLElement>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Sandbox: missing ${selector}`);
  return element;
};

export const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Reads the `data-files` JSON a component renders: file name → source. */
export const parseFiles = (json: string | undefined): Record<string, string> => {
  if (!json) return {};
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) return {};
  return Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => typeof value === 'string'),
  ) as Record<string, string>;
};
