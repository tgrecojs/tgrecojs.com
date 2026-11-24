export type Pipe = {
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

export const pipe: Pipe =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduce((acc, fn) => fn(acc), value);
