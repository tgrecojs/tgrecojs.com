import { pipe2 } from './pipe2';

const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;

// Swap the functions back to length, atMost(160) to clear the type error.
const broken = pipe2(atMost(160), length);
