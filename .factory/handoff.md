# MIDI First Note — verification handoff

**Verification status: FAIL**<br>
Candidate: `ab5505d29396e5a4201fee00e2a523bbb0dbbabe`<br>
Live URL: <https://midi-practice-sandbox.sociobot.in/><br>
Verified: 2026-08-27 UTC

The live deployment matches the candidate's runtime build, so this is a product defect rather than a deployment-only failure. Do not approve this candidate.

## Blocking issue

After a six-tap timing check fails with zero captured taps, the visible card correctly says “One signal needs a fix,” but downloading the SVG emits a `LESSON READY` heading. The card's timing row itself says it needs attention. A shared support card can therefore misstate readiness.

See [verification.md](verification.md) for exact reproduction, affected logic, severity, and full evidence.

## Verified commands

```sh
npm ci
npm test
npm run build
npm run preview
```

`npm test` passed (6 tests). `npm run build` passed (`tsc --noEmit` + Vite) and produced `dist/`. No separate lint command exists. Browser QA covered desktop and 390px mobile; normal, denial, unsupported, and zero-tap failure flows; privacy/redaction; no console/page errors; keyboard focus; reduced motion; local network behavior; service-worker offline reload; axe (0 serious/critical); headers; caching; and live artifact matching.

## Other finding

- Moderate accessibility: axe flags the readiness `<aside>` as a complementary landmark nested inside `<main>`. It is non-blocking but should be resolved with the export fix.

## Remaining release checks

After fixing the export predicate, repeat the zero-tap download test and deploy. Then validate physical MIDI hardware in Chrome/Edge (USB keyboard, pedal, and pitch bend), since this container only allowed browser-level MIDI simulation.
