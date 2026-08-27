# MIDI First Note

MIDI First Note is a free, no-account browser diagnostic for the five minutes before a remote piano lesson. It checks the parts that commonly fail before a lesson site can start: MIDI permission, input signal, note labeling, sustain, pitch bend, browser audio, and practical tap alignment.

Live site: <https://midi-practice-sandbox.sociobot.in>

## Who it is for

- Piano teachers helping a student troubleshoot remotely
- Hobbyists checking a new MIDI controller or browser
- Lesson-tool authors who need a privacy-safe setup result

The result can be copied as text or downloaded as an SVG support card. Both outputs intentionally omit device names and played-note history.

## Browser support

Web MIDI works in current Chromium-based browsers such as Chrome, Edge, and Opera on supported desktop and Android platforms. Safari and Firefox do not currently expose the required Web MIDI API. The audio test remains useful there, but MIDI-dependent checks are marked unsupported rather than guessed.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL Vite prints. MIDI access requires a secure context; `localhost` is treated as secure by modern browsers.

## Test and build

```sh
npm test
npm run build
npm run preview
```

The exact production build command is `npm run build`. Output lands in `dist/`, with `dist/index.html` at its root. Unit tests cover MIDI parsing, note naming, tap statistics, and redacted result generation.

For hardware verification, connect and power on a keyboard before pressing “Connect MIDI keyboard.” The application requests standard MIDI input with SysEx disabled.

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App. `public/staticwebapp.config.json` supplies security headers, navigation fallback, and immutable asset caching. The service worker caches the built shell after first load for offline reopening.

## Privacy and architecture

MIDI messages and audio synthesis stay in the browser. Nothing is sent to an application server; there are no accounts, cookies, analytics, third-party runtime scripts, or CDN fonts. Session state is memory-only. See [`privacy/index.html`](privacy/index.html) and [`.factory/design.md`](.factory/design.md).

The application uses Vite, vanilla TypeScript, the Web MIDI API, and Web Audio API. The hero illustration was generated for this project; its exact prompt and provenance are in `assets/src/hero-signal-lab.prompt.json`.

## License

MIT — see [LICENSE](LICENSE).
