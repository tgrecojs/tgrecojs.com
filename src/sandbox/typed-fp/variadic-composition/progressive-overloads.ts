import { trim, toLowerCase, trace, length, atMost } from './functions';

type Pipe = {
  // Add a five-function overload for pipe here.
  <A, B>(ab: (a: A) => B): (a: A) => B;
  <A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
  <A, B, C, D>(ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): (a: A) => D;
  <A, B, C, D, E>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
  ): (a: A) => E;
};

const pipe: Pipe =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduce((acc, fn) => fn(acc), value);

type Compose = {
  // Add a five-function overload for compose here.
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

// Both calls need a five-function overload.
const fitsSummary = pipe(trim, toLowerCase, trace('normalized'), length, atMost(160));
const fitsSummaryWithCompose = compose(atMost(160), length, trace('normalized'), toLowerCase, trim);

const summary = '  A short summary  ';
console.log(fitsSummary(summary)); // true
console.log(fitsSummaryWithCompose(summary)); // true
