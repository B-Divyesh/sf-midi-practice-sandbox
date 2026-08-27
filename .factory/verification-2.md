# Independent verification report — PASS

**Work order:** `midi-practice-sandbox-verify-2`

**Candidate commit:** `d4f0d457896f77a4950aaebe4d0acd91c2706d39`

**Production URL:** <https://midi-practice-sandbox.sociobot.in/>

**Verified:** 2026-08-27 UTC
**Verdict:** **PASS**

The live deployment matches the requested candidate exactly and the repaired readiness/export behavior passes the original verifier's failed-timing reproduction. No release defects were found.

## Local candidate gates

The checkout started at the requested SHA with a clean worktree.

```sh
npm ci              # passed; 55 packages added, 0 vulnerabilities
npm test            # passed; 1 file, 8 tests
npm run build       # passed; tsc --noEmit + Vite, dist/ produced
```

There is no separate lint script; TypeScript checking is part of `npm run build`. The production output is inside the static-product budgets: main JS is 14,998 B (5,930 B gzip), main CSS is 16,365 B (4,500 B gzip), the self-hosted font is 8,404 B, and the mobile hero WebP is 22,478 B. No external font, script, analytics, or third-party asset is present.

The standalone Lighthouse CLI could not connect to the installed Playwright Chromium, so this report does not assert a Lighthouse score. Direct bundle, browser-load, accessibility, and layout checks below were completed instead.

## End-to-end browser evidence

Playwright Chromium exercised the fresh local production preview and the live URL independently. Web MIDI and Web Audio were browser-mocked because no physical keyboard is attached to this container.

- Normal flow passed: MIDI access requested exactly `{ sysex: false, software: false }`; MIDI 60 rendered as `C4`; mapping confirmation, optional-control skips, test tone, sound confirmation, timing skip, ready card, copied/downloaded support output all worked.
- Real control message paths passed: sustain CC 64 and an off-centre pitch-bend message changed both controls to received. A `No sound` result correctly blocked readiness; replaying the tone and confirming it restored readiness.
- Boundary input passed: note 0 displayed `C-1`, note 127 displayed `G9`, and note-on with velocity 0 did not overwrite the latest played note.
- Recovery paths passed: denied MIDI access gives an actionable retry, retry grants access; unavailable Web MIDI disables the control and names supported browsers; zero captured taps gives `0 of 6 captured — try again` and blocks readiness.
- The prior regression is fixed in both representations: after zero-tap timing, the downloaded SVG says `NEEDS ATTENTION` and `Timing: needs attention`, never `LESSON READY`.
- The support SVG and copied result did not contain `C4`, a mock device identifier, a device name, or note history. The browser held no localStorage, sessionStorage, or cookies; the only cache was the PWA shell cache.
- Normal-flow runtime made six requests, all same-origin. There were no console errors or page errors locally or on the deployed app.

## Accessibility, responsive, and PWA evidence

- Factory `verify-url.sh` passed against the local preview and live URL: HTTP 200, title, `lang=en`, one `h1`, `main`, image alternatives, labelled buttons, and no browser errors. Its measured network-idle times were 593 ms local and 736 ms live in this environment.
- Axe-core 4.11.0 ran in Playwright on the completed diagnostic: **0 violations** (therefore 0 serious and 0 critical).
- Keyboard-only smoke passed: the skip link is the first Tab target and has a visible 3px solid focus ring. At 390 × 844 CSS px, both document and body widths were 390 px (no horizontal overflow). Visual desktop and mobile inspection found the diagnostic stacks and actions remain legible and reachable.
- `prefers-reduced-motion: reduce` changes scrolling to `auto` and button transitions to `0.00001s`.
- The live service worker activated as `/sw.js`, uses cache `midi-first-note-v3`, precaches the shell, calls `skipWaiting()` and `clients.claim()`, and successfully served a live offline reload with the titled app shell, visible offline banner, and no errors.

## Deployment identity, privacy, and response policy

Every one of the 22 retrievable runtime files from a fresh `dist/` matched the corresponding deployed URL byte-for-byte by SHA-256. `staticwebapp.config.json` is deployment configuration rather than a served runtime file.

The live home page is HTTPS 200 and sends HSTS, CSP restricted to `'self'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), geolocation=(), microphone=()`. HTML, legal pages, manifest, and service worker revalidate at 30 seconds; hashed assets are `public, max-age=31536000, immutable`. `/privacy/` and `/terms/` both return 200.

## Defects by severity

| Severity | Defects |
| --- | --- |
| Critical | None found |
| High | None found |
| Moderate | None found |
| Low | None found |

## Limits

- A physical MIDI keyboard, sustain pedal, pitch-bend control, and real audio output were not available. Browser-level simulation covered permission, input, controls, audio state, recovery, timing, export, and privacy behavior. A short current Chrome/Edge hardware smoke remains prudent before a hardware-specific release claim.
- The live PWA offline result passed. Vite preview intermittently logged a cached font/subresource network error under Playwright's artificial offline switch even though the resource was present in Cache Storage; this did not reproduce against the byte-identical HTTPS deployment and is not treated as a product defect.
