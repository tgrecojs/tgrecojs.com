const pipe2 =
  <A, B, C>(first: (value: A) => B, second: (value: B) => C) =>
  (value: A): C =>
    second(first(value));

const compose2 =
  <A, B, C>(second: (value: B) => C, first: (value: A) => B) =>
  (value: A): C =>
    second(first(value));

const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const values = [5];
console.log(values.map(addTen).map(double)); // [30]
console.log(values.map(value => double(addTen(value)))); // [30]

const addTenThenDouble = pipe2(addTen, double);
const addTenThenDoubleWithCompose = compose2(double, addTen);

console.log(addTenThenDouble(5)); // 30
console.log(addTenThenDoubleWithCompose(5)); // 30
console.log(pipe2(double, addTen)(5)); // 20

const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;
const trim = (value: string) => value.trim();

const fitsSummary = pipe2(length, atMost(160));
const fitsTrimmedSummary = pipe2(trim, fitsSummary);
const padded = "  " + "x".repeat(160) + "  ";

console.log(fitsSummary("x".repeat(160))); // true
console.log(fitsSummary("x".repeat(161))); // false
console.log(fitsSummary(padded)); // false
console.log(fitsTrimmedSummary(padded)); // true

// Uncomment to see TypeScript reject incompatible steps:
// const broken = pipe2(atMost(160), length);
