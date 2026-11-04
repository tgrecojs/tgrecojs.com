const identity = <T>(value: T): T => value;

const result = identity('thomas');
const year = identity(2019);

console.log(result.toUpperCase());
console.log(year.toFixed(0));

// console.log(result.toFixed(2));
