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
