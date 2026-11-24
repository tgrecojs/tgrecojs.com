const pipe2 =
  <A, B, C>(first: (value: A) => B, second: (value: B) => C) =>
  (value: A): C =>
    second(first(value));

const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

console.log(pipe2(addTen, double)(5)); // 30
