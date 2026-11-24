import { trim, length, atMost, trace } from './functions';

type Compose = {
  <A, B>(ab: (a: A) => B): (a: A) => B;
  <A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;
  <A, B, C, D>(cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => D;
  <A, B, C, D, E>(
    de: (d: D) => E,
    cd: (c: C) => D,
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => E;
};

const compose: Compose =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

const fitsSummary = compose(atMost(160), length, trim);
// (a: string) => boolean
const fitsSummaryTraced = compose(atMost(160), length, trace('trimmed'), trim);
// (a: string) => boolean

console.log(fitsSummary('  A short summary  ')); // true
console.log(fitsSummary('x'.repeat(161))); // false
console.log(fitsSummaryTraced('  A short summary  '));
// trimmed :: A short summary
// true
