# Verification report — FAIL

**Work order:** `midi-practice-sandbox-verify-1`<br>
**Candidate:** `ab5505d29396e5a4201fee00e2a523bbb0dbbabe`<br>
**URL:** <https://midi-practice-sandbox.sociobot.in/><br>
**Verified:** 2026-08-27 UTC<br>
**Verdict:** **FAIL**

The deployment is live and its 22 retrievable runtime files are byte-identical to the candidate's locally-built `dist/` output. This is not a deployment-only failure. The candidate itself has the high-severity export defect below.

## Blocking defect

### High — failed timing exports as “LESSON READY”

**Reproduction (local production build; the same JS is deployed):**

1. Grant mocked Web MIDI input, send `Note On, C4 / MIDI 60`, confirm the mapping, skip the two optional controls, unlock audio, confirm sound, and skip timing. The on-screen card correctly reaches “Ready for the lesson.”
2. Start the six-tap check again and send no MIDI notes. After the final pulse, the screen correctly reports `0 of 6 captured — try again` and changes to “One signal needs a fix.”
3. Download the support card.

The exported SVG contains `LESSON READY` despite its own timing row reporting `needs attention`. The implementation's download-only readiness predicate in `src/app.ts` treats a failed timing result as merely completed, while the on-screen predicate correctly treats it as a failure. A teacher receiving this card can be told the instrument is ready when a required tap/timing check has failed. This contradicts the brief's goal of a comprehensible, shareable readiness diagnosis.

## What passed

- Clean candidate checkout was already at the required SHA and had no tracked changes before verification.
- `npm ci`: passed; 56 packages audited, 0 vulnerabilities.
- `npm test`: passed — 1 file, 6 tests.
- Available static checks: `npm run build` runs `tsc --noEmit` and Vite; passed. No lint script exists in `package.json`.
- Production build: passed; `dist/` produced. Main JS is 14,751 B / 5,860 B gzip, CSS 16,365 B / 4,500 B gzip, self-hosted font 8,404 B, and mobile WebP 22,478 B. The initial JS budget is comfortably below 200 KB.
- Desktop end-to-end browser flow with simulated Web MIDI and Web Audio: MIDI request used exactly `{ sysex: false, software: false }`; a C4 event labelled as C4 / 60; mapping, controls, audio, timing skip, readiness state, clipboard export, and downloaded SVG redaction worked. No console or page errors and no request left the local origin.
- Boundary and recovery flows: zero-tap timing correctly reaches an actionable failure; denied MIDI permission provides “Try MIDI access again”; unsupported Web MIDI is clearly disclosed and disables the MIDI button.
- Privacy: static inspection and runtime capture found no storage, analytics, CDN, external scripts, or normal-flow outbound request. Device names and note history were excluded from copied text and downloaded SVG; output contains only count/status/timing.
- Accessibility/browser smoke: title, `lang=en`, one `h1`, `main`, image alt, labelled controls, skip link, and a 3px visible keyboard focus ring passed. At 390 × 844 there was no page-level horizontal overflow. Reduced-motion transition duration was 0.00001 s.
- Axe-core 4.11.0 through Playwright: **0 serious / 0 critical** findings (42 passes). One moderate `landmark-complementary-is-top-level` finding is listed below.
- PWA: service worker activated and controlled the page; a reload while offline after first visit loaded the titled shell, showed the offline banner, and produced no errors. Source confirms versioned cache (`midi-first-note-v2`), `skipWaiting`, and `clients.claim` for updates.
- Factory `verify-url.sh` passed against both local production preview and live URL: HTTP 200, title/lang/main, one h1, zero missing alts/unlabelled buttons, and zero console errors. It measured 639 ms local and 698 ms live to network-idle in this environment.
- Live checks: home HTML plus every retrievable runtime file (22 files: HTML, JS, CSS, images, font, manifest, service worker, maps, legal pages) matched the fresh `dist/` SHA-256 bytes. `staticwebapp.config.json` is a deployment configuration file and is not served as a runtime file. Live response headers include HSTS, CSP restricting resources to `'self'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), geolocation=(), microphone=()`. Hashed assets have `Cache-Control: public, max-age=31536000, immutable`; HTML/service worker use 30-second revalidation.

## Non-blocking defect

### Moderate — nested complementary landmark

Axe reports `landmark-complementary-is-top-level` for the readiness `<aside>` inside `<main>`. This is not serious or critical, but moving/reclassifying the complementary landmark would remove the moderate structural warning.

## Limits

- No physical MIDI device was available. The Web MIDI event path was exercised with browser-level simulation, including permission, note, and failure states; a small real Chrome/Edge hardware matrix remains necessary before release approval.
- The bundled `@axe-core/cli` could not locate a system Chrome in this container. Equivalent axe-core 4.11.0 analysis was run in the installed Playwright Chromium. The standalone Lighthouse CLI could not connect to that Playwright Chromium, so no new Lighthouse score is asserted here; the bundle and browser-load measurements above are the direct performance evidence.

## Required fix and re-verification

Make the SVG export use the same complete readiness/failure predicate as the visible card, so failed or unsupported timing cannot render `LESSON READY`. Re-run the zero-tap/download reproduction, the automated suite, build, axe scan, PWA offline check, and live artifact comparison after deployment.
