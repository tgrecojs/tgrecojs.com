// The functions, containers and laws behind <FunctorLaws>. The component runs this at
// build time for the first render and again in the browser whenever a picker changes,
// so the page arrives filled in and never shifts when the script starts.

type Fn = (x: number) => number;

// Labels are written the way the post writes its functions: `const f = (x) => x / 0.5;`
export const FUNCTIONS = {
  half: { label: '(x) => x / 0.5', fn: (x: number) => x / 0.5 },
  times16: { label: '(x) => x * 16', fn: (x: number) => x * 16 },
  double: { label: '(x) => x * 2', fn: (x: number) => x * 2 },
  addOne: { label: '(x) => x + 1', fn: (x: number) => x + 1 },
  square: { label: '(x) => x * x', fn: (x: number) => x * x },
  negate: { label: '(x) => -x', fn: (x: number) => -x },
} satisfies Record<string, { label: string; fn: Fn }>;

interface Mappable {
  map: (fn: Fn) => Mappable;
  show: () => string;
}

const arrayOf = (xs: number[]): Mappable => ({ map: (fn) => arrayOf(xs.map(fn)), show: () => `[${xs.join(', ')}]` });

// The Box from the post.
const Box = (x: number): Mappable => ({ map: (fn) => Box(fn(x)), show: () => `Box(${x})` });

// Not a functor: its map also counts calls, so mapping changes more than the value.
const Counted = (x: number, maps = 0): Mappable => ({
  map: (fn) => Counted(fn(x), maps + 1),
  show: () => `Counted(${x}, maps: ${maps})`,
});

// `group` becomes an <optgroup>, so the picker itself says which one isn't a functor.
export const CONTAINERS = {
  array: { label: '[25]', group: 'Functors', of: (x: number) => arrayOf([x]) },
  box: { label: 'Box(25)', group: 'Functors', of: (x: number) => Box(x) },
  counted: { label: 'Counted(25)', group: 'Not a functor', of: (x: number) => Counted(x) },
} satisfies Record<string, { label: string; group: string; of: (x: number) => Mappable }>;

export interface Picks {
  container: keyof typeof CONTAINERS;
  f: keyof typeof FUNCTIONS;
  g: keyof typeof FUNCTIONS;
  h: keyof typeof FUNCTIONS;
}

// The post's own example: data = [25], f divides by 0.5, g multiplies by 16.
export const DEFAULT_PICKS: Picks = { container: 'array', f: 'half', g: 'times16', h: 'addOne' };

export interface LawResult {
  name: string;
  left: { expr: string; value: string };
  right: { expr: string; value: string };
  holds: boolean;
}

const START = 25;
const id: Fn = (x) => x;
const compose = (a: Fn, b: Fn): Fn => (x) => a(b(x));

export const checkLaws = (picks: Picks): LawResult[] => {
  const [f, g, h] = [picks.f, picks.g, picks.h].map((key) => FUNCTIONS[key].fn);
  const data = () => CONTAINERS[picks.container].of(START);
  const law = (name: string, left: LawResult['left'], right: LawResult['right']): LawResult => ({
    name, left, right, holds: left.value === right.value,
  });

  return [
    law('Identity', { expr: 'data.map(id)', value: data().map(id).show() }, { expr: 'data', value: data().show() }),
    law(
      'Composition',
      { expr: 'data.map(g).map(f)', value: data().map(g).map(f).show() },
      { expr: 'data.map((x) => f(g(x)))', value: data().map(compose(f, g)).show() },
    ),
    // Plain functions, no container: this one holds whatever data is.
    law(
      'Associativity',
      { expr: '((f ∘ g) ∘ h)(25)', value: String(compose(compose(f, g), h)(START)) },
      { expr: '(f ∘ (g ∘ h))(25)', value: String(compose(f, compose(g, h))(START)) },
    ),
  ];
};

// Which picks each law reads, for the `for` attribute on its <output>s.
export const INPUTS_BY_LAW: (keyof Picks)[][] = [['container'], ['container', 'f', 'g'], ['f', 'g', 'h']];

export const summarize = (results: LawResult[]) => {
  const failed = results.filter((r) => !r.holds).map((r) => r.name.toLowerCase());
  const sentence = `${failed.join(' and ')} ${failed.length === 1 ? 'fails' : 'fail'}.`;
  return failed.length === 0 ? 'All three laws hold.' : sentence[0].toUpperCase() + sentence.slice(1);
};
