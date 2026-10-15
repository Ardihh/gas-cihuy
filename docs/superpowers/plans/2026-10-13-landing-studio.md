# Landing Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session.

**Goal:** Implement a distinctive, accessible editorial cosplay rental landing.
**Architecture:** Preserve server catalog/auth loading. Compose a static landing
inside the client navigation/reveal shell; isolate collection and estimate state.
**Tech Stack:** Next.js 16.3.4, React 19.2.8, JavaScript, CSS Modules, native motion.
**Spec:** `docs/superpowers/specs/2026-10-13-landing-studio-design.md`.

## Global Constraints

Keep routes, eight-item preview, authenticated catalog gate and live domain data.
Reuse CatalogImage and formatRupiah. No installation, API mutation, staging,
commit, push, auth changes, dashboard changes or invented product data.
Execute in the current clean ming workspace so the existing localhost:3000
server can verify the actual edits. Keep progress here; no extra workflow tooling.

## Review Focus

- API failure/empty catalog: no fabricated products or misleading prices.
- Broken/missing images: reserved geometry and readable product identity.
- Long names/categories: wrap at 320px without losing controls or metadata.
- Reduced motion/no JavaScript: readable content and usable navigation.
- Authenticated/anonymous navigation: account CTA and catalog gate preserved.

## Task 1 — Product presentation

- [x] Test hero selection with normalized fake fixtures: prioritize an available
  trusted image, retain real fallback items, empty → null, never mutate data.
- [x] Run `node --test app/landing/landing-presentation.test.mjs`; watch the
  placeholder fail the meaningful selection branches, implement, rerun green.
- [x] Reuse existing auth-navigation, catalog-image and catalog filter tests.

## Task 2 — Landing composition

- [ ] `app/LandingClient.js`: navigation, Escape/menu behavior and one-shot
  IntersectionObserver; receive static server children.
- [ ] `app/landing/LandingContent.js`: hero, journey, pricing context, FAQ, closing.
- [ ] `app/landing/ProductVisual.js`: existing CatalogImage plus labeled SVG fallback.
- [ ] `app/landing/CollectionPreview.js`: existing category filter, live labels/links.
- [ ] `app/landing/RentalEstimate.js`: isolated 1–7-day example estimate using real rate.
- [ ] `app/page.js`: preserve service calls and limit; compose server children.
- [ ] `app/page.module.css`: responsive editorial geometry and coherent motion.
- [ ] `app/CatalogImage.js`: preserve wrapper API, map hero priority to Next 16 preload.

## Task 3 — Iterate and verify

- [ ] Browser QA at all six widths; keyboard/menu/anchors/reduced motion/no JS.
- [ ] Record development timing, DOM/JS costs and network destinations; distinguish
  synthetic measurements from production Core Web Vitals and missing live-data QA.
- [ ] Independent Superpowers frontend/correctness review and Ponytail second opinion.
- [ ] Run tests, lint, build, diff check; inspect final status and package integrity.

## Execution record

- Baseline: clean ming; localhost renders catalog unavailable, 146 DOM elements,
  no product images; one dev navigation FCP 560ms, TTFB 436ms (not production CWV).
- Ruling: use the explicitly requested workspace and existing dev server; do not
  create a second checkout/server. Cost: dev timing is inherently variable.
- Ruling: select the coherent direction and execute without another design-choice
  gate, as explicitly delegated by the brief. No staging/commit steps apply.
- Task 1: five meaningful RED failures, then 6/6 GREEN; focused existing image,
  navigation and catalog tests plus new tests passed 30/30.
- Task 2: composition complete. ESLint caught an internal reload anchor; replaced
  it with a disabled-while-pending router.refresh button in the collection client.
  Static narrative and API/auth calls stay server-side.
- Browser: hero checked at all six widths; no page overflow. Closed-menu children
  are excluded from clipping checks because they are not rendered to the user.
