const array = ["TypeScript", "currying", "applesauce"];

const mapValues = <A, B>(
  transform: (value: A) => B,
  values: readonly A[],
): B[] => values.map(transform);

const lengths = mapValues((value: string) => value.length, array);

console.log({ lengths });
