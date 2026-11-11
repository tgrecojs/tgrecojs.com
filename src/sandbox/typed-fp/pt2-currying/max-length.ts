const maxLength = (limit: number) => (value: string): boolean =>
  value.length <= limit;

const fitsTitle = maxLength(60);
const fitsSummary = maxLength(160);

const text = "How to build a TypeScript validator for every input in your application";

console.log({ title: fitsTitle(text), summary: fitsSummary(text) });
// { title: false, summary: true }
