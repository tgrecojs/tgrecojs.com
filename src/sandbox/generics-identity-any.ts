const identity = (value: any): any => value;

const result = identity('thomas');

console.log(result.toUpperCase());
console.log(result.toFixed(2)); // Type-checks, but throws when Run is pressed.
