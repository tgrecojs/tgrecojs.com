import { trim, length, atMost } from './functions';

const pipe =
  (...fns: Array<(value: any) => any>) =>
  (initialValue: any) =>
    fns.reduce((acc, fn) => fn(acc), initialValue);

const fitsSummary = pipe(trim, length, atMost(160));
// (initialValue: any) => any
const broken = pipe(length, trim, atMost(160));
// (initialValue: any) => any

console.log(fitsSummary('  A short summary  ')); // true
// Uncomment to see the invalid order fail at runtime:
// console.log(broken('  A short summary  '));
