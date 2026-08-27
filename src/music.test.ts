import { describe, expect, it } from 'vitest';
import { calculateTapStats, midiNoteName, parseMidiMessage, supportSummary } from './music';

describe('MIDI parsing', () => {
  it('labels MIDI note 60 as middle C', () => {
    expect(midiNoteName(60)).toBe('C4');
    expect(midiNoteName(69)).toBe('A4');
  });

  it('treats note-on velocity zero as note-off', () => {
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ kind: 'note-off', channel: 1, note: 60, velocity: 0 });
  });

  it('recognizes sustain and centered pitch bend messages', () => {
    expect(parseMidiMessage([0xb2, 64, 127])).toEqual({ kind: 'control', channel: 3, controller: 64, value: 127 });
    expect(parseMidiMessage([0xe0, 0, 64])).toEqual({ kind: 'pitch-bend', channel: 1, value: 8192, normalized: 0 });
  });
});

describe('tap timing', () => {
  it('reports absolute alignment and signed offset', () => {
    expect(calculateTapStats([-40, 60, -80, 20])).toEqual({
      count: 4,
      meanAbsoluteMs: 50,
      meanOffsetMs: -10,
      rating: 'tight'
    });
  });

  it('returns null without taps', () => {
    expect(calculateTapStats([])).toBeNull();
  });
});

describe('support summary privacy', () => {
  it('contains diagnostic evidence but no hardware identifiers or notes', () => {
    const summary = supportSummary({
      access: 'passed', input: 'passed', mapping: 'passed', controls: 'skipped',
      audio: 'passed', timing: 'passed', portCount: 1, timingMs: 72, outputLatencyMs: 18
    });
    expect(summary).toContain('1 input port');
    expect(summary).toContain('±72 ms');
    expect(summary).toContain('no device name or note history');
    expect(summary).not.toContain('C4');
  });
});
