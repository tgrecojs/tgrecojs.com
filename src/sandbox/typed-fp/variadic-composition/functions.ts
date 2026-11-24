export const trace =
  (label: string) =>
  <T>(value: T): T => {
    console.log(label, "::", value);
    return value;
  };

export const trim = (value: string) => value.trim();
export const toLowerCase = (value: string) => value.toLowerCase();
export const length = (value: string) => value.length;
export const atMost = (limit: number) => (count: number) => count <= limit;
export const addTen = (x: number) => x + 10;
export const double = (x: number) => x * 2;
