const compose2 =
  <A, B, C>(second: (value: B) => C, first: (value: A) => B) =>
  (value: A): C =>
    second(first(value));

const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const addTenThenDoubleWithCompose = compose2(double, addTen);

console.log(addTenThenDoubleWithCompose(5)); // 30
