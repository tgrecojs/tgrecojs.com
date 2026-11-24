import { pipe } from './pipe';
import { trim, length, atMost, trace } from './functions';

const fitsSummary = pipe(trim, length, atMost(160));
// (a: string) => boolean

const fitsSummaryTraced = pipe(trim, trace('trimmed'), length, atMost(160));
// (a: string) => boolean

console.log(fitsSummary('  A short summary  ')); // true
console.log(fitsSummaryTraced('  A short summary  '));
// trimmed :: A short summary
// true
