import { pipe2 } from './pipe2';

const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;
const trim = (value: string) => value.trim();

const fitsSummary = pipe2(length, atMost(160));
const fitsTrimmedSummary = pipe2(trim, fitsSummary);

const padded = '  ' + 'x'.repeat(160) + '  ';

console.log(fitsSummary(padded)); // false
console.log(fitsTrimmedSummary(padded)); // true
