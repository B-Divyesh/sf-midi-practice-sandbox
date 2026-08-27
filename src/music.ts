export type ParsedMidiMessage =
  | { kind: 'note-on'; channel: number; note: number; velocity: number }
  | { kind: 'note-off'; channel: number; note: number; velocity: number }
  | { kind: 'control'; channel: number; controller: number; value: number }
  | { kind: 'pitch-bend'; channel: number; value: number; normalized: number }
  | { kind: 'other'; channel: number };

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export function midiNoteName(note: number): string {
  const safeNote = Math.max(0, Math.min(127, Math.round(note)));
  const pitch = NOTE_NAMES[safeNote % 12];
  const octave = Math.floor(safeNote / 12) - 1;
  return `${pitch}${octave}`;
}

export function parseMidiMessage(data: ArrayLike<number>): ParsedMidiMessage {
  const status = Number(data[0] ?? 0);
  const first = Number(data[1] ?? 0);
  const second = Number(data[2] ?? 0);
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;

  if (command === 0x90 && second > 0) {
    return { kind: 'note-on', channel, note: first, velocity: second };
  }
  if (command === 0x80 || (command === 0x90 && second === 0)) {
    return { kind: 'note-off', channel, note: first, velocity: second };
  }
  if (command === 0xb0) {
    return { kind: 'control', channel, controller: first, value: second };
  }
  if (command === 0xe0) {
    const value = first + (second << 7);
    return { kind: 'pitch-bend', channel, value, normalized: (value - 8192) / 8192 };
  }
  return { kind: 'other', channel };
}

export interface TapStats {
  count: number;
  meanAbsoluteMs: number;
  meanOffsetMs: number;
  rating: 'tight' | 'usable' | 'loose';
}

export function calculateTapStats(offsets: number[]): TapStats | null {
  if (offsets.length === 0) return null;
  const meanAbsoluteMs = Math.round(offsets.reduce((sum, value) => sum + Math.abs(value), 0) / offsets.length);
  const meanOffsetMs = Math.round(offsets.reduce((sum, value) => sum + value, 0) / offsets.length);
  const rating = meanAbsoluteMs <= 90 ? 'tight' : meanAbsoluteMs <= 180 ? 'usable' : 'loose';
  return { count: offsets.length, meanAbsoluteMs, meanOffsetMs, rating };
}

export type ResultState = 'waiting' | 'passed' | 'failed' | 'skipped' | 'unsupported';

export interface SupportResult {
  access: ResultState;
  input: ResultState;
  mapping: ResultState;
  controls: ResultState;
  audio: ResultState;
  timing: ResultState;
  portCount: number;
  timingMs: number | null;
  outputLatencyMs: number | null;
}

/**
 * The readiness decision is intentionally shared by the on-screen result and
 * the exported support card. A completed check is not necessarily a passing
 * check: failures and unsupported required signals must remain visible in
 * every representation of the diagnostic.
 */
export type ReadinessStatus = 'ready' | 'needs-attention' | 'in-progress';

export function readinessStatus(result: SupportResult): ReadinessStatus {
  const checks: ResultState[] = [
    result.access,
    result.input,
    result.mapping,
    result.controls,
    result.audio,
    result.timing
  ];
  if (checks.some((value) => value === 'failed' || value === 'unsupported')) return 'needs-attention';

  const essentialsPassed = [result.access, result.input, result.mapping, result.audio]
    .every((value) => value === 'passed');
  const finished = result.controls !== 'waiting' && result.timing !== 'waiting';
  return essentialsPassed && finished ? 'ready' : 'in-progress';
}

export function supportSummary(result: SupportResult): string {
  const label = (value: ResultState) => ({
    waiting: 'not checked',
    passed: 'pass',
    failed: 'needs attention',
    skipped: 'not available / skipped',
    unsupported: 'unsupported'
  })[value];

  const timing = result.timingMs === null ? label(result.timing) : `±${result.timingMs} ms practical tap alignment`;
  const output = result.outputLatencyMs === null ? 'not reported' : `${result.outputLatencyMs} ms reported output latency`;

  return [
    'MIDI FIRST NOTE — REDACTED SUPPORT RESULT',
    `Browser MIDI: ${label(result.access)} (${result.portCount} input port${result.portCount === 1 ? '' : 's'})`,
    `Input signal: ${label(result.input)}`,
    `Pitch mapping: ${label(result.mapping)}`,
    `Pedal + pitch bend: ${label(result.controls)}`,
    `Sound: ${label(result.audio)} (${output})`,
    `Timing: ${timing}`,
    'Privacy: no device name or note history included.'
  ].join('\n');
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
}

/** Create the redacted, offline-only support card without exposing MIDI data. */
export function supportCardSvg(result: SupportResult): string {
  const status = readinessStatus(result);
  const summary = supportSummary(result);
  const lines = summary.split('\n');
  const accent = status === 'ready' ? '#56f2d2' : status === 'needs-attention' ? '#ff7a90' : '#ffd166';
  const symbol = status === 'ready' ? '✓' : status === 'needs-attention' ? '!' : '?';
  const title = status === 'ready' ? 'LESSON READY' : status === 'needs-attention' ? 'NEEDS ATTENTION' : 'CHECK IN PROGRESS';
  const lineSvg = lines.map((line, index) => `<text x="64" y="${226 + index * 38}" fill="${index === 0 ? '#aab7c9' : '#f4efd8'}" font-size="${index === 0 ? 15 : 19}">${escapeXml(line)}</text>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#070b17"/><rect x="28" y="28" width="844" height="544" fill="#10172a" stroke="#2b3957" stroke-width="2"/><path d="M28 84h844" stroke="#2b3957"/><g font-family="ui-monospace, monospace"><text x="62" y="64" fill="#aab7c9" font-size="13" letter-spacing="2">MIDI FIRST NOTE / SUPPORT CARD</text><rect x="62" y="112" width="56" height="56" fill="none" stroke="${accent}" stroke-width="3"/><text x="90" y="150" text-anchor="middle" fill="${accent}" font-size="29">${symbol}</text><text x="142" y="137" fill="${accent}" font-size="29" font-weight="700">${title}</text>${lineSvg}<text x="62" y="550" fill="#56f2d2" font-size="13">LOCAL ONLY • NO DEVICE NAME • NO NOTE HISTORY</text></g></svg>`;
}
