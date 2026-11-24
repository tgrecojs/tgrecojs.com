export const pipe2 =
  <A, B, C>(first: (value: A) => B, second: (value: B) => C) =>
  (value: A): C =>
    second(first(value));
