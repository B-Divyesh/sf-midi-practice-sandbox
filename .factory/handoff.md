# MIDI First Note — repair handoff

**Release status: PASS**

**Base verifier report:** `642ee605b9ff78faac138523b3d407064cda61cf`

**Repaired product commits:** `6e79556d791716a4a8e00959a6fba74f1860b4d3`, `5fbb9c6b2e9157c14aa4d06fc95434879d2e49f2`

**Production:** <https://midi-practice-sandbox.sociobot.in/>

**Deployed:** 2026-08-27 UTC to Azure Static Web App `sf-midi-practice-sandbox`

## What changed

- Removed the divergent download-only readiness predicate. `readinessStatus()` is now the single decision used by both the visible support card and its downloaded SVG.
- A completed timing test with zero captures, or an unsupported timing result, now exports `NEEDS ATTENTION` and the matching timing evidence; it cannot export `LESSON READY`.
- Added exact unit regression coverage for the verifier reproduction, including the SVG text and an unsupported timing case (8 tests total).
- Changed the readiness wrapper from `aside` to `section`, removing axe's moderate nested complementary-landmark finding without changing its visual layout.
- Versioned the service-worker cache as `midi-first-note-v3` and made the precached shell cache-first. This keeps hashed assets coherent through this release update and makes an offline reopen load without page errors.

## Verification evidence

All commands were run from a clean dependency install on 2026-08-27 UTC.

```sh
npm ci                 # 55 packages added; 0 vulnerabilities
npm test               # 1 file, 8 tests passed
npm run build          # tsc --noEmit + Vite passed; dist/ produced
```

The production bundle is within the static-product budget: main JS is 14,998 B / 5,930 B gzip; main CSS is 16,365 B / 4,500 B gzip; self-hosted font is 8,404 B; mobile WebP is 22,478 B. There is no separate lint script; TypeScript checking is part of `npm run build`. There is no package/consumer artifact for this static web app.

Browser QA used installed Playwright Chromium against the production build and the final live URL:

- Desktop mocked Web MIDI / Web Audio flow passed. It requests exactly `{ sysex: false, software: false }`, labels MIDI 60 as C4, handles controls/audio, and has no page or console errors.
- Exact regression reproduction passed locally and live: after a six-pulse, zero-tap run the visible card says “One signal needs a fix”; the downloaded SVG contains `NEEDS ATTENTION` and `Timing: needs attention`, and does not contain `LESSON READY`.
- Keyboard smoke passed (the skip link is the first Tab target); 390 × 844 has no horizontal overflow.
- `verify-url.sh` passed locally (534 ms network-idle) and live (604 ms): title, `lang`, one h1, main landmark, image alt text, labelled buttons, and no load errors.
- axe-core 4.11.0 in Playwright: 0 violations, 42 passes. This includes the former nested-complementary check.
- PWA: after online precache, cache `midi-first-note-v3` controlled the page; offline reload retained the titled shell, showed the offline banner, and had 0 page errors. `skipWaiting` and `clients.claim` preserve update activation.
- Privacy/request policy: no analytics, storage, third-party runtime resources, device names, or note history were added. Support output remains redacted.
- Live identity: all 22 retrievable runtime files matched the final `dist/` byte-for-byte. Live home is HTTPS 200 with self-only CSP, HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and restrictive camera/geolocation/microphone permissions. Hashed JS is `Cache-Control: public, max-age=31536000, immutable`.

## How to run and deploy

```sh
npm ci
npm test
npm run build
npm run preview
```

Deployment remains static Azure Static Web Apps from `dist/`; `public/staticwebapp.config.json` is included in the deployed output. No server, account, payment, or API configuration is required.

## Remaining limitation

No physical MIDI device was available in the container. Browser-level simulation covered permission, input, controls, audio, timing failure, download, offline, and unsupported/failure predicates. Before a hardware-specific release sign-off, smoke-test a USB keyboard, sustain pedal, and pitch bend in current Chrome and Edge.
