const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const values = [5];

console.log(values.map(addTen).map(double)); // [30]
console.log(values.map((value) => double(addTen(value)))); // [30]
