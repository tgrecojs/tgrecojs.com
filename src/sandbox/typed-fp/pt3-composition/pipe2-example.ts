const pipe2 =
  <A, B, C>(first: (value: A) => B, second: (value: B) => C) =>
  (value: A): C =>
    second(first(value));

const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const addTenThenDouble = pipe2(addTen, double);

console.log(addTenThenDouble(5)); // 30
