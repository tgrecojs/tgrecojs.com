import { pipe2 } from './pipe2';
import { trim, length, atMost } from './functions';

const fitsSummary = pipe2(trim, pipe2(length, atMost(160)));
// (value: string) => boolean

console.log(fitsSummary('  ' + 'x'.repeat(160) + '  ')); // true
console.log(fitsSummary('x'.repeat(161))); // false
