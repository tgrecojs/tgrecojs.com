// pipe: runs its functions left to right
type Pipe = {
  (): <A>(a: A) => A;
  <A, B>(ab: (a: A) => B): (a: A) => B;
  <A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
  <A, B, C, D>(ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): (a: A) => D;
  <A, B, C, D, E>(
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
  ): (a: A) => E;
};

const pipe: Pipe =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduce((acc, fn) => fn(acc), value);

// compose: runs its functions right to left
type Compose = {
  <A, B>(ab: (a: A) => B): (a: A) => B;
  <A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;
  <A, B, C, D>(cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => D;
  <A, B, C, D, E>(
    de: (d: D) => E,
    cd: (c: C) => D,
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => E;
};

const compose: Compose =
  (...fns: Array<(value: any) => any>) =>
  (value: any) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// trace: logs the value passing through, then hands it back untouched
const trace =
  (label: string) =>
  <T>(value: T): T => {
    console.log(label, "::", value);
    return value;
  };

// Some small functions to combine
const trim = (value: string) => value.trim();
const toLowerCase = (value: string) => value.toLowerCase();
const length = (value: string) => value.length;
const atMost = (limit: number) => (count: number) => count <= limit;
const addTen = (x: number) => x + 10;
const double = (x: number) => x * 2;

const normalize = pipe(trim, trace("trimmed"), toLowerCase);
console.log(normalize("  Hello World  ")); // "hello world"

const fitsSummary = pipe(normalize, length, trace("length"), atMost(160));
console.log(fitsSummary("  A short summary  ")); // true

const addTenThenDouble = compose(double, addTen);
console.log(addTenThenDouble(1)); // 22

// Things to try:
// 1. Swap length and atMost(160) in fitsSummary. Where does the error land?
// 2. Move trace("trimmed") to a different spot in normalize.
// 3. Rewrite fitsSummary with compose instead of pipe.
// 4. Call pipe() with no functions and hover over the result.
