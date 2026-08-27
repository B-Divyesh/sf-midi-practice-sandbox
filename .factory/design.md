# MIDI First Note — visual thesis

## Direction and product fit

**Signal lab / pixel demoscene.** MIDI setup is normally invisible: a chain of permissions, bytes, mappings, and audio state. The interface makes that chain legible as a compact 1990s hardware test bench—scan-line dividers, square indicators, a note scope, and tiny diagnostic labels—without turning the product into a game or decorating the actual checks. The visual metaphor is a pre-flight cartridge: insert keyboard, run five checks, export the result.

This is a deliberately dark, single-mode instrument surface. Painting the full background removes OS-theme ambiguity and maintains the high-contrast phosphor-screen identity. Warm paper-colored text prevents the cyan-on-black cliché from becoming harsh.

## Palette

All colors are CSS tokens. Text combinations target WCAG AA or better.

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#070b17` | Page backdrop, like an unlit LCD |
| `--deck` | `#10172a` | Primary instrument panels |
| `--deck-raised` | `#18223a` | Raised controls and selected steps |
| `--paper` | `#f4efd8` | Primary copy (15.6:1 on ink) |
| `--muted` | `#aab7c9` | Supporting copy (9.0:1 on ink) |
| `--signal` | `#56f2d2` | Active input and focus (13.3:1 on ink) |
| `--violet` | `#b9a5ff` | Secondary waveform/channel coding |
| `--amber` | `#ffd166` | Pending/warning state (13.7:1 on ink) |
| `--danger` | `#ff7a90` | Failed/blocked state (7.5:1 on ink) |
| `--grid` | `#2b3957` | Dividers and idle segments (3.1:1 UI contrast) |

State never depends on color: every lamp includes an icon and plain-language label.

## Type and scale

- Display/labels: self-hosted **Silkscreen Regular**, subset WOFF2, used sparingly for the wordmark, headings, chips, and numeric readouts. Its square counters evoke tracker software and hardware LCDs.
- Body: system humanist stack (`ui-sans-serif`, `system-ui`, Segoe UI, sans-serif) for high legibility and zero extra payload.
- Scale: 12px diagnostic label, 16px body, 20px panel title, 28px section title, fluid 40–64px h1. Body line height is 1.55; prose maxes at 68 characters. Tabular numerals are enabled for readings.

## Spacing and shape

- 4px base rhythm: 4, 8, 12, 16, 24, 32, 48, 72px.
- Main shell max width 1180px. Hero uses a 7/5 column split; diagnostics become one column below 820px.
- Corners stay 0–6px, recalling equipment rather than soft lifestyle cards. A double-line highlight creates physical depth. Cards only separate genuine diagnostic stages.
- Interactive targets are at least 44px with 8px separation. The phone layout drops the decorative waveform labels, stacks actions, and allows the piano strip to scroll horizontally.

## Interaction grammar

- Primary action is always a filled signal-green control. Secondary actions are outlined deck controls.
- A five-segment rail communicates progress in order: permission, input, notes, controls, audio/timing. A check can be revisited but the next incomplete check gets emphasis.
- Incoming MIDI creates one short pixel “pulse” on the input lamp and moves the note scope. The musical event, not general scrolling, owns motion.
- Diagnosis wording follows `status — evidence — next action`. Unsupported browsers get an honest manual audio path while input-dependent checks remain explicitly unverified.
- The final readiness card is a screen-readable result first and a downloaded SVG second. It never contains a device name, MIDI history, IP, account, or stable identifier.

## Motion policy

UI transitions run 160–220ms using opacity and transform. The note scope has a single 240ms rise/fall when an event arrives; no decoration loops. Under `prefers-reduced-motion: reduce`, smooth scrolling, transforms, pulses, and transitions become instant opacity/state changes. There is no flashing above 3Hz.

## Asset plan and provenance

- **Hero illustration:** an original AI-generated pixel-art still life of a compact MIDI keyboard connected to a diagnostic terminal. It clarifies the tested signal chain and reserves open space around the product copy. Generated with the factory image deployment on 2026-08-27. Source PNG and exact prompt sidecar live in `assets/src/`; production WebP is in `public/assets/`. Generated imagery is disclosed in the footer.
- **UI icons and piano keys:** authored in HTML/CSS/SVG within this repository; no external icon library.
- No third-party logos, real people, copyrighted characters, or externally sourced textures.

### Prompt sheet

Use case: `stylized-concept`  
Asset type: responsive landing-page hero illustration  
Subject: a small 25-key MIDI keyboard feeding a compact diagnostic terminal; one glowing key, visible cable, five tiny unlabeled status lamps, abstract note blocks moving toward the terminal  
World: imaginary early-1990s demoscene music workstation on a dark studio bench  
Materials: matte charcoal plastic, translucent teal key light, chunky pixels, restrained dithering, crisp hard edges  
Light/lens: orthographic three-quarter view, soft cyan screen glow, deep navy negative space, no photoreal depth of field  
Palette words: midnight navy, warm ivory keys, phosphor mint, soft violet, tiny amber accents  
Composition: landscape 3:2, centered apparatus with breathing room, readable at 360px, no essential detail at outer 8%  
Negative list: no text, no letters, no numbers, no logos, no watermark, no hands, no people, no branded hardware, no music notation, no gradients, no glossy 3D, no neon city, no visual noise
