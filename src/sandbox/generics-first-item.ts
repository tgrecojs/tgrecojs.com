const first = <T>(items: readonly T[]): T | undefined => items[0];

const titles = ['Generics', 'Curried Functions'];
const posts = [
  { title: 'Generics', draft: true },
  { title: 'Curried Functions', draft: true }
];

const firstTitle = first(titles);
const firstPost = first(posts);

console.log(firstTitle?.toUpperCase());
console.log(firstPost?.title);
console.log(first([]));

// Uncomment to see TypeScript reject a number method on a post title:
// console.log(firstPost?.title.toFixed(2));
