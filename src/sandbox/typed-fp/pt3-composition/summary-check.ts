import { pipe2 } from './pipe2';

const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;

const fitsSummary = pipe2(length, atMost(160));
// (value: string) => boolean

console.log(fitsSummary('x'.repeat(160))); // true
console.log(fitsSummary('x'.repeat(161))); // false
