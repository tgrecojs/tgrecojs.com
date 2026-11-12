const array = ["TypeScript", "currying", "applesauce"];

const mapValues =
  <A, B>(transform: (value: A) => B) =>
  (values: readonly A[]): B[] =>
    values.map(transform);

// remove `: string` below and TypeScript can no longer tell what type `value` is
const getLengths = mapValues((value: string) => value.length);

console.log({ lengths: getLengths(array) });
