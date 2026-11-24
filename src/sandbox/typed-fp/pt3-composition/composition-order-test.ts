import { strictEqual } from 'node:assert';
import { pipe2 } from './pipe2';

const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const addTenThenDouble = pipe2(double, addTen);

strictEqual(addTenThenDouble(5), 30);
console.log('Test passed.');

// Swap double and addTen above to make the test pass.
