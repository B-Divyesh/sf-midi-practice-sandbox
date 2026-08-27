# MIDI First Note — build handoff

Work order: `midi-practice-sandbox-build-1`

Completed: 2026-08-27

Artifact: static web app, deployed from `dist/`

## What was built

- A complete, one-page MIDI readiness console with five guided stages:
  1. Web MIDI support, permission, port count, and hot-plug state
  2. Live note name, MIDI number, velocity, channel, and visual key feedback
  3. User-confirmed middle-C mapping using the unambiguous `C4 · MIDI 60` reference
  4. Sustain pedal (CC64) and pitch-bend detection, with honest “not on my keyboard” paths
  5. User-unlocked Web Audio test, reported browser output latency when available, and a six-pulse practical tap-alignment test
- A live, plain-language readiness summary with actionable failure states.
- Redacted support exports in downloadable SVG and clipboard text. Neither output includes device names or played-note history.
- Explicit unsupported-browser, denied-permission, zero-port, silent-audio, incomplete-timing, and offline states.
- Responsive 390px mobile layout, complete keyboard focus path, visible focus treatment, 44px controls, reduced-motion behavior, and semantic landmarks.
- Original pixel/demoscene “signal lab” hero art, responsive WebP derivatives, PNG fallback, prompt sidecar, and provenance in `.factory/design.md`.
- Local Silkscreen WOFF2 (8.4 KB), no runtime CDN, analytics, cookies, account, backend, or third-party script.
- `/privacy/` and `/terms/` pages, PWA manifest, installable offline shell, sitemap, robots file, security headers, and immutable asset caching for Azure Static Web Apps.

## Run and deploy

```sh
npm ci
npm test
npm run build
npm run preview
```

The required build command is exactly `npm run build`. It writes `dist/index.html`, `dist/privacy/index.html`, and `dist/terms/index.html`. Deploy the contents of `dist/`.

## Verification

- `npm test`: **6/6 passing** (MIDI parsing, note names, pitch bend, tap metrics, support-card privacy)
- `npm run build`: **passing** under Node 22.23.2 / Vite 7.3.6
- Factory `verify-url.sh`: HTTP 200, correct title/lang/main, exactly one h1, no missing alt text, no unlabeled buttons, **0 console errors**
- axe-core 4.13.0 on `/`, `/privacy/`, and `/terms/`: **0 violations**
- Lighthouse mobile, local production preview:
  - Performance: **100**
  - Accessibility: **100**
  - Best practices: **100**
  - SEO: **100**
  - FCP: **1.1 s**
  - LCP: **1.4 s**
  - CLS: **0**
  - Total blocking time: **60 ms**
- Initial production payloads: main JS **14.75 KB** uncompressed / **5.86 KB** gzip; CSS **16.37 KB** / **4.50 KB** gzip; mobile hero WebP **22.48 KB**; font **8.40 KB**.
- Playwright 390×844 simulated-device flow: permission → C4 note → sustain → pitch bend → audio confirmation → timing skip → green readiness card; **passed**.
- Export redaction assertion against a deliberately injected fake device name and played C4: **passed**.
- Mobile horizontal overflow: **0 px**.
- Service-worker offline reload after first visit: full styled shell and offline status **passed**.

## Known gaps and honest limits

- The disposable build container had no physical MIDI controller. The complete event path was exercised with browser-level Web MIDI simulation, but a small Chrome/Edge/Android hardware matrix should be checked after deployment.
- “Tap alignment” measures the combined player reaction and browser/MIDI arrival against six scheduled pulses. It is intentionally labeled a practical check, not a laboratory audio round-trip latency measurement. Browser-reported audio output latency is shown separately when available.
- Web MIDI is unavailable in Safari and Firefox today. The app explains this and leaves the local sound test usable; it does not manufacture a green MIDI result.

## Suggested next steps

1. Test two common USB keyboards, one Bluetooth MIDI controller, and one sustain pedal against the deployed HTTPS origin.
2. Ask three teachers whether the redacted card contains enough evidence to resolve setup issues without exposing hardware identity.
3. If support demand justifies it, add an optional teacher-provided session code only after a separate privacy review; no cloud feature is needed for v1.
