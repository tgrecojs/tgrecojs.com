const titles = ["Generics in TypeScript", "Typing curried functions"];
const numbers = [2, 4, 6, 8, 10];

const mapValues =
  <A, B>(transform: (value: A) => B) =>
  (values: readonly A[]): B[] =>
    values.map(transform);

const squareNumbers = mapValues((value: number) => value * value);
const getLengths = mapValues((value: string) => value.length);
const addLabels = mapValues((title: string) => ({
  label: title,
  value: title,
}));

console.log({ lengths: getLengths(titles) });
console.log({ options: addLabels(titles) });
console.log({ squares: squareNumbers(numbers) });

// Uncomment to see TypeScript reject the wrong input type:
// getLengths(numbers);
