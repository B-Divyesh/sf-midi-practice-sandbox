# MIDI First Note — verification handoff

## Release status: PASS

**Verified candidate:** `d4f0d457896f77a4950aaebe4d0acd91c2706d39`

**Production:** <https://midi-practice-sandbox.sociobot.in/>
**Verification date:** 2026-08-27 UTC

Independent QA found the production runtime byte-identical to this candidate (22/22 retrievable files) and found no critical, high, moderate, or low release defects. The detailed evidence is in [verification-2.md](verification-2.md).

## What was verified

- Clean `npm ci`, `npm test` (8 passed), and `npm run build` (`tsc --noEmit` plus Vite) passed.
- Complete local and deployed browser journeys covered MIDI permission/input, C4 mapping, sustain, pitch bend, audio, timing, support-card download, denied-permission retry, unavailable Web MIDI, no-sound recovery, note boundaries, and zero-tap timing failure.
- The previous export regression is fixed: a failed timing run exports `NEEDS ATTENTION`, never `LESSON READY`.
- Privacy, security headers, CSP/self-only outbound resources, no user storage, keyboard focus, 390px mobile layout, reduced motion, axe (0 violations), and PWA offline reload all passed on the live site.
- Bundle sizes meet the static-web budget: 5.93 KB gzip initial main JS and 4.50 KB gzip CSS; no CDN dependencies.

## Run / verify

```sh
npm ci
npm test
npm run build
npm run preview
```

The product is deployed as the contents of `dist/` to static hosting. No account, API, billing, or server configuration is required.

## Remaining limit / next step

No physical MIDI hardware was available for this independent run. Before claiming compatibility with a particular keyboard or browser release, smoke-test a USB keyboard, sustain pedal, pitch bend, and actual audio output in current Chrome and Edge. No code changes are required by this verification.
