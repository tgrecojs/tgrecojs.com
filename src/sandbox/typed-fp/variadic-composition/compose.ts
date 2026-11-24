export type Compose = {
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

export const compose: Compose =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduceRight((acc, fn) => fn(acc), value);
