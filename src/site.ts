// Site-wide facts that more than one template needs: who writes here, where else
// to find them, and the webring. Templates read from this file rather than
// repeating URLs.
export const site = {
  name: "tgrecojs.com",
  author: "Thomas Greco",
  handle: "@tgrecojs",
  // One sentence used three ways: the default meta description, the home social card,
  // and the author line at the end of every post (where a leading author name is bolded).
  description:
    "Thomas Greco writes about software engineering, life, and what he’s learning and building.",
  // Footer links, in this order. `rel="me"` lets IndieWeb tools verify the profiles
  // belong to this site.
  links: [
    // A SimpleLogin alias, not a mailbox: if it gets spammed, replace it there and here.
    { label: "Email", href: "mailto:hello@tgrecojs.com" },
    { label: "RSS", href: "/rss.xml" },
    { label: "GitHub", href: "https://github.com/tgrecojs", rel: "me" },
    { label: "Twitter", href: "https://x.com/tgrecojs", rel: "me" },
    //   { label: 'Hindley Milner Systems', href: 'https://hindleymilner.com' },
  ],
  // The webring badge in the footer renders only once `url` is set. webri.ng
  // identifies this site by the `via` parameter, so the links only work after
  // https://tgrecojs.com is added as a member of the ring.
  webring: {
    name: "Types & Telescopes",
    url: "https://webri.ng/webring/types_and_telescopes",
    prev: "https://webri.ng/webring/types_and_telescopes/previous?via=https%3A%2F%2Ftgrecojs.com",
    next: "https://webri.ng/webring/types_and_telescopes/next?via=https%3A%2F%2Ftgrecojs.com",
    random:
      "https://webri.ng/webring/types_and_telescopes/random?via=https%3A%2F%2Ftgrecojs.com",
  },
} as const;
