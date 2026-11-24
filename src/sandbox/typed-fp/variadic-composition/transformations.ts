const trace =
  (label: string) =>
  <T>(value: T): T => {
    console.log(label, "::", value);
    return value;
  };

const trim = (value: string) => value.trim();
const toLowerCase = (value: string) => value.toLowerCase();
const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;
const addTen = (x: number) => x + 10;
const double = (x: number) => x * 2;

console.log(trim('  A short summary  ')); // 'A short summary'
console.log(length('hello')); // 5
console.log(atMost(160)(5)); // true
trace('length')(5); // length :: 5
