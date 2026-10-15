# Cosplay Asik — Backstage, before your entrance

## Intent

Evolve “Ruang Ganti Karakter” into an expressive editorial fitting studio.
The visitor discovers a character, understands the rental model, and follows
the existing authenticated catalog flow. Product imagery should dominate when
the live catalog is available; illustrations must never impersonate products.

## Design decisions

- Retain warm chalk, ink, rust, Outfit and Inter. Architectural frames, garment
  tags and asymmetric composition replace the small-image/text-heavy hero.
- Hero: “Karakter pilihanmu. Giliranmu memakainya.” beside a large portrait
  image. Names and prices stay outside photographs. A labeled fitting-room
  illustration occupies the same reserved geometry when photography is absent.
- Narrative: transformation hero → category-filtered public collection →
  five-step rental journey → interactive, clearly labeled price estimate →
  practical fitting questions → final catalog CTA.
- “Koleksi” is the eight-item editorial preview; “Katalog” is the existing
  authenticated full experience. Anonymous account CTA remains “Masuk”;
  authenticated account CTA remains “Dashboard”.
- Preserve actual prices, sizes, status and links. No fabricated availability,
  social proof, rental counts, ratings or backend capabilities.

## Motion

Use a common decelerating easing with quick 180ms feedback and 600ms entrances.
The hero receives a short, non-blocking entrance. Static sections reveal once
with IntersectionObserver. Product hover gently changes image scale and arrow
direction. A small native scroll-timeline hero translation is desktop-only and
progressive enhancement. No scroll hijacking, pointer tracking, JS scroll loop,
animation library or infinite animation. Reduced motion shows every final state.

## Responsive and engineering constraints

- Verify 1440 / 1200 / 1024 / 768 / 390 / 320px. Mobile stacks the hero and
  simplifies motion; controls wrap, images retain aspect ratio, long names wrap.
- Next.js 16.3.4 / React 19.2.8, JavaScript, CSS Modules, existing image loader.
- Static narrative is a Server Component passed through a client shell slot.
  Client modules own only interactions; server data/auth remains unchanged.
- No dependencies, shadcn initialization, API mutations, branch switching,
  staging, commits or pushes. Preserve unrelated files.

## Verification limits at discovery

The existing localhost server is available but the live catalog currently
renders its service-unavailable state. No local costume photos exist. Verify
that state honestly; do not inject demo catalog data into normal runtime.
Context7 indexes Next.js 16.2.9, not installed 16.3.4; bundled docs prevail.
