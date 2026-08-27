import { describe, expect, it } from 'vitest';
import { calculateTapStats, midiNoteName, parseMidiMessage, readinessStatus, supportCardSvg, supportSummary } from './music';

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

describe('support card readiness', () => {
  const otherwiseReady = {
    access: 'passed', input: 'passed', mapping: 'passed', controls: 'skipped',
    audio: 'passed', portCount: 1, timingMs: null, outputLatencyMs: 18
  } as const;

  it('uses the same failure result when timing was completed but captured no taps', () => {
    const result = { ...otherwiseReady, timing: 'failed' } as const;

    expect(readinessStatus(result)).toBe('needs-attention');
    expect(supportCardSvg(result)).toContain('NEEDS ATTENTION');
    expect(supportCardSvg(result)).not.toContain('LESSON READY');
    expect(supportCardSvg(result)).toContain('Timing: needs attention');
  });

  it('does not mark unsupported timing as lesson ready', () => {
    expect(readinessStatus({ ...otherwiseReady, timing: 'unsupported' })).toBe('needs-attention');
  });
});
