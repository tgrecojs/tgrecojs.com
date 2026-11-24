const addTen = (value: number) => value + 10;
const double = (value: number) => value * 2;

const addTenThenDoubleExplicit = (value: number) => double(addTen(value));

console.log(addTenThenDoubleExplicit(5)); // 30
