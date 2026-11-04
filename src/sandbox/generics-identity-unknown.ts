const identity = (value: unknown): unknown => value;

const result = identity('thomas');

console.log(result);
console.log(result.toUpperCase()); // Intentional type error: result is unknown.
