# Future: a distributed tgrecojs.com

Notes on making this site readable without tgrecojs.com, Vercel, or a server at all.
Nothing here is built. The site today is a static Astro build with a service worker, which
is the right base for all of it: the whole site is a folder of files with no server logic.

## Why not Hypercore in the browser

The Holepunch stack (Hypercore, Hyperdrive, Hyperswarm) is built on raw UDP (UDX) and Bare,
so the DHT and swarm cannot run inside a browser tab. Browsers only get WebSocket and
WebRTC. There are two ways around that, and both involve a non-browser peer somewhere.

## Options, from least to most work

1. **Pear app reader.** Publish the built `dist/` folder as a Hyperdrive from a small Pear
   app (or a `hyperdrive` CLI mirror). Anyone with Pear can open the drive's key and read the
   site peer to peer, including offline once synced. The web site stays as is; the Pear key
   is a second front door. Smallest step, and the one closest to the HM work.

2. **DHT relay for browsers.** Run one always-on Bare or Node peer that seeds the drive and
   exposes `@hyperswarm/dht-relay` over WebSocket. A browser build of the site could then
   connect through the relay with `hyperswarm` and read the drive directly. The relay is a
   server, so this is "fewer servers", not "no server". Worth doing only if a Pear reader
   turns out to have no audience.

3. **IPFS pinning.** `dist/` is content addressed as is. Pin it (Pinata, Fleek, or a home
   node) and publish the CID under an IPNS name or a DNSLink TXT record on tgrecojs.com.
   Browsers with IPFS support (Brave) resolve it natively; everyone else uses a gateway.
   Zero changes to the build.

4. **Arweave or similar permanent storage.** Upload `dist/` once per release; the site
   lives at a permanent URL with no renewal. Fine for a blog that changes rarely. Costs a
   little per deploy.

5. **Content feeds instead of pages.** Publish posts as a signed feed (RSS today; Nostr or
   ActivityPub later) so readers follow the writing without visiting the site. Comments and
   replies come for free on ActivityPub. This is independent of where the HTML is hosted.

## What the build already gives us

- Every page is a plain file, so any of the above can serve `dist/` unchanged.
- Relative asset paths and a `site` config that can be switched to a gateway or drive URL.
- A service worker that keeps read pages available offline, which is the browser-side half
  of "distributed" regardless of transport.

## Open questions

- Does the mirror script become a Hyperdrive mirror too, so HM and tgrecojs.com share one
  drive of posts?
- Figures are self-contained HTML, which suits content addressing; should figures get
  their own drive or CID so other sites can embed them?
- Is any of this worth doing before there are readers? Probably option 1 or 3, because each
  is an afternoon and changes nothing about the site.
