import { strictEqual } from 'node:assert';
import { pipe2 } from './pipe2';

const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;

const fitsSummary = pipe2(length, atMost(160));
// (value: string) => boolean

const atLimitResult = fitsSummary('x'.repeat(160));
const overLimitResult = fitsSummary('x'.repeat(161));

strictEqual(atLimitResult, true);
strictEqual(overLimitResult, false);

console.log(atLimitResult); // true
console.log(overLimitResult); // false
