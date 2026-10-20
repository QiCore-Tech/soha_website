# E2E Tests

This suite uses Node's built-in test runner plus `playwright`, so it does not depend on `@playwright/test`.

## Commands

- `npm run test:e2e`
  Starts a temporary Next dev server on a free local port and runs the browser tests.
- `npm run build && npm start` (or `npm run preview`)
  Serves the existing `out/` export on `http://127.0.0.1:3000`; set `PORT` to change the port. This is a **read-only static preview**, not `next start` or Next dev. It never imports API handlers or contacts Feishu/email services. All methods other than GET/HEAD return 405, so forms need browser mocks. Missing builds fail with build instructions; missing routes return the exported 404 page with HTTP 404, not a homepage fallback.
- `npm run test:preview`
  Runs dependency-free preview regression tests using temporary fixtures: direct/deep links, HEAD, MIME types, 404, write rejection, path traversal and symlink protection, and refusal to reuse a server in static mode.
- `npm run test:e2e:static`
  Runs all browser tests against `out/`, without building. Set `QICORE_E2E_MODE=static` when invoking an individual existing test directly. Static mode always owns a fresh read-only server, never probes/reuses port 3012, and rejects `QICORE_E2E_BASE_URL` instead of silently testing a dev server.
- `npm run test:e2e:smoke`
  Runs only the new static deep-link/404, persisted-language, and Chromium/WebKit viewport smoke tests. Requires an existing `out/` and installed Playwright Chromium/WebKit browsers and their OS libraries. Browser launch failures are failures, not silently skipped coverage.
- `npm run test:e2e:ci`
  Builds once, runs preview regression tests, then runs the complete E2E suite in explicit static-artifact mode.

## Current Coverage

- Homepage renders two image banners without loading the retired voxel canvas.
- Swiper pagination selects a slide, keyboard navigation wraps, and touch swipes work on mobile.
- Fullscreen layouts cover phone portrait/landscape, iPad and desktop sizes with a fixed translucent header.
- Carousel previous/next arrows are intentionally absent on desktop and touch devices, including hover/focus states.
- Each active banner randomly zooms in or out over 3.8 seconds without scaling below full coverage; reduced motion disables this image animation.
- Active pagination expands into a capsule; GSAP animates active copy and product-story media without controlling the Swiper track.
- Autoplay advances every five seconds even on hover; keyboard focus pauses it.
- Reduced-motion preferences disable automatic animation, pinned stories and video autoplay.
- Company navigation returns to a working carousel.
- Existing company, product, news, careers and locale interactions remain covered.

To test the running site without starting another server:
`QICORE_E2E_BASE_URL=http://127.0.0.1:3002 npm run test:e2e` (dev mode only).

The static smoke suite uses fresh isolated browser contexts at 390×844, 844×390, 768×1024, 1024×768 and 1440×900 in both Chromium and WebKit. Every non-GET/HEAD request and every `/api/` request is fulfilled in memory, external reads are blocked, and service workers are disabled. No signup reaches external systems. Coverage includes saved English before hydration, blocked localStorage, back/forward history, and Chinese/English persistence. Browser tests fail on uncaught page errors, application console errors and unexpected local HTTP errors (intentional missing-route checks and blocked external resource errors are excluded); missing WebKit dependencies must be installed separately rather than changing package dependencies. For browser installation use `npx playwright install chromium webkit` (OS libraries may also be required via your environment's provisioning).

## Homepage product-story regression

`node --test --test-concurrency=1 src/tests/e2e/home-story.test.mjs` covers both Chromium and WebKit, two desktop ScrollTrigger chapters, native layout fallbacks, all five viewport sizes in both languages, breakpoint/reduced-motion changes, ten cached-navigation round trips, autoplay rejection/user pause and a failed animation chunk. It writes generated review screenshots to `.artifacts/home-story/`; these are visual QA artifacts, not pixelmatch assertions.

The default requires both browser binaries. For an **explicit** local Chromium-only diagnostic while downloads are pending, PowerShell can select the installed Edge channel:

```powershell
$env:QICORE_E2E_ENGINES = "chromium"
$env:QICORE_E2E_CHROMIUM_CHANNEL = "msedge"
$env:QICORE_E2E_MODE = "static"
node --test --test-concurrency=1 src/tests/e2e/home-story.test.mjs
```

This is Edge/Chromium coverage only, not a WebKit pass. Unset both selection variables to restore full engine coverage. Static mode still starts its own read-only server and requires freshly built `out/`. `QICORE_E2E_CHROMIUM_CHANNEL` is also supported by the existing homepage and static-smoke suites. Forms/API writes are mocked; external reads are blocked by the product-story suite.

For concurrent development checks, set `QICORE_DEV_DIST_DIR=.next-preview` so the test dev server does not share `.next/` with a production build. Do not run a default dev server and a build against the same cache. The product-story static run does not use either Next cache.

The home-laptop suite also covers sustained native xgplayer fullscreen through resize/pin refresh and left/right workspace-copy reveals with a readable reduced-motion fallback.
