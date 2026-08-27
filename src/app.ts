import './styles.css';
import { calculateTapStats, midiNoteName, parseMidiMessage, readinessStatus, supportCardSvg, supportSummary, type ResultState, type SupportResult } from './music';

type ControlState = 'waiting' | 'passed' | 'skipped';

interface SessionState {
  access: ResultState;
  input: ResultState;
  mapping: ResultState;
  sustain: ControlState;
  bend: ControlState;
  audio: ResultState;
  timing: ResultState;
  portCount: number;
  timingMs: number | null;
  outputLatencyMs: number | null;
}

const state: SessionState = {
  access: 'waiting', input: 'waiting', mapping: 'waiting', sustain: 'waiting', bend: 'waiting',
  audio: 'waiting', timing: 'waiting', portCount: 0, timingMs: null, outputLatencyMs: null
};

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const accessState = byId('access-state');
const inputState = byId('input-state');
const mappingState = byId('mapping-state');
const controlsState = byId('controls-state');
const audioState = byId('audio-state');
const connectButton = byId<HTMLButtonElement>('connect-midi');
const mappingPassButton = byId<HTMLButtonElement>('mapping-pass');
const mappingFailButton = byId<HTMLButtonElement>('mapping-fail');
const playToneButton = byId<HTMLButtonElement>('play-tone');
const heardToneButton = byId<HTMLButtonElement>('heard-tone');
const noToneButton = byId<HTMLButtonElement>('no-tone');
const timingButton = byId<HTMLButtonElement>('start-timing');
const timingSkipButton = byId<HTMLButtonElement>('skip-timing');
const toast = byId('toast');

let midiAccess: MIDIAccess | null = null;
let audioContext: AudioContext | null = null;
let soundUnlocked = false;
let toastTimer = 0;
let lampTimer = 0;
let timingTargets: number[] = [];
let timingHits: Array<number | null> = [];
let timingActive = false;
let timingTimers: number[] = [];

function controlsResult(): ResultState {
  if (state.sustain === 'waiting' || state.bend === 'waiting') return 'waiting';
  if (state.sustain === 'skipped' && state.bend === 'skipped') return 'skipped';
  return 'passed';
}

function cardResult(): SupportResult {
  return {
    access: state.access,
    input: state.input,
    mapping: state.mapping,
    controls: controlsResult(),
    audio: state.audio,
    timing: state.timing,
    portCount: state.portCount,
    timingMs: state.timingMs,
    outputLatencyMs: state.outputLatencyMs
  };
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

const stateLabels: Record<ResultState, string> = {
  waiting: 'Waiting', passed: 'Passed', failed: 'Check fix', skipped: 'Skipped', unsupported: 'Unsupported'
};

function setChip(element: HTMLElement, value: ResultState, override?: string): void {
  const symbol = value === 'passed' ? '✓' : value === 'failed' || value === 'unsupported' ? '!' : value === 'skipped' ? '–' : '○';
  element.className = `state-chip state-${value}`;
  element.innerHTML = `<span aria-hidden="true">${symbol}</span> ${override ?? stateLabels[value]}`;
}

function resultLabel(value: ResultState): string {
  return ({ waiting: 'Not checked', passed: 'Pass', failed: 'Needs attention', skipped: 'Not available', unsupported: 'Unsupported' })[value];
}

function updateProgress(): void {
  const checks: Array<[string, boolean]> = [
    ['access', state.access !== 'waiting'],
    ['input', state.input === 'passed'],
    ['mapping', state.mapping !== 'waiting'],
    ['controls', controlsResult() !== 'waiting'],
    ['audio', state.audio !== 'waiting' && state.timing !== 'waiting']
  ];
  let foundCurrent = false;
  for (const [name, done] of checks) {
    const rail = document.querySelector<HTMLElement>(`[data-progress="${name}"]`);
    const card = document.querySelector<HTMLElement>(`[data-check="${name}"]`);
    rail?.classList.toggle('is-done', done);
    card?.classList.toggle('is-complete', done);
    const current = !done && !foundCurrent;
    rail?.classList.toggle('is-current', current);
    card?.classList.toggle('is-active', current);
    if (current) foundCurrent = true;
  }
}

function updateReadiness(): void {
  const controls = controlsResult();
  const result = cardResult();
  const values: Array<[string, ResultState, string?]> = [
    ['result-access', state.access, state.access === 'passed' ? `Allowed · ${state.portCount} port${state.portCount === 1 ? '' : 's'}` : undefined],
    ['result-input', state.input],
    ['result-mapping', state.mapping],
    ['result-controls', controls, controls !== 'waiting' ? `${state.sustain === 'passed' ? 'Pedal ✓' : 'Pedal n/a'} · ${state.bend === 'passed' ? 'Bend ✓' : 'Bend n/a'}` : undefined],
    ['result-audio', state.audio, state.audio === 'passed' && state.outputLatencyMs !== null ? `Pass · ${state.outputLatencyMs} ms out` : undefined],
    ['result-timing', state.timing, state.timingMs !== null ? `±${state.timingMs} ms` : undefined]
  ];

  for (const [id, value, custom] of values) {
    const output = byId(id);
    output.textContent = custom ?? resultLabel(value);
    output.dataset.result = value;
  }

  setChip(accessState, state.access);
  setChip(inputState, state.input);
  setChip(mappingState, state.mapping);
  const completedControls = [state.sustain, state.bend].filter((value) => value !== 'waiting').length;
  setChip(controlsState, controls, controls === 'waiting' ? `${completedControls} of 2` : controls === 'skipped' ? 'Not available' : 'Complete');
  const audioGroup = state.audio === 'failed' || state.timing === 'failed'
    ? 'failed'
    : state.audio === 'passed' && state.timing !== 'waiting' ? 'passed' : 'waiting';
  setChip(audioState, audioGroup, audioGroup === 'passed' ? 'Complete' : undefined);

  const readiness = byId('readiness-card');
  const title = byId('readiness-title');
  const copy = byId('readiness-copy');
  const icon = readiness.querySelector<HTMLElement>('.readiness-icon');
  const status = readinessStatus(result);
  const hasStarted = state.access !== 'waiting' || state.audio !== 'waiting';

  readiness.classList.toggle('is-ready', status === 'ready');
  readiness.classList.toggle('is-blocked', status === 'needs-attention');
  if (status === 'ready') {
    title.textContent = 'Ready for the lesson';
    copy.textContent = controls === 'skipped' || state.timing === 'skipped'
      ? 'Core notes and sound are ready. Optional hardware or timing was marked unavailable.'
      : 'Input, mapping, controls, sound, and timing all passed in this browser.';
    if (icon) icon.textContent = '✓';
  } else if (status === 'needs-attention') {
    title.textContent = 'One signal needs a fix';
    copy.textContent = 'Open the matching check for the exact next step, then retry it.';
    if (icon) icon.textContent = '!';
  } else if (hasStarted) {
    title.textContent = 'Check in progress';
    copy.textContent = 'Keep going—the first unfinished check is highlighted in amber.';
    if (icon) icon.textContent = '…';
  } else {
    title.textContent = 'Not checked yet';
    copy.textContent = 'Start with MIDI access. Your result updates after every check.';
    if (icon) icon.textContent = '?';
  }
  updateProgress();
}

function updateControlDetails(): void {
  const sustainLamp = byId('sustain-lamp');
  const bendLamp = byId('bend-lamp');
  sustainLamp.classList.toggle('is-live', state.sustain === 'passed');
  bendLamp.classList.toggle('is-live', state.bend === 'passed');
  byId('sustain-detail').textContent = state.sustain === 'passed' ? 'Sustain message received' : state.sustain === 'skipped' ? 'Marked not available' : 'Press and release it once';
  byId('bend-detail').textContent = state.bend === 'passed' ? 'Pitch movement received' : state.bend === 'skipped' ? 'Marked not available' : 'Move the wheel or strip';
  byId<HTMLButtonElement>('skip-sustain').disabled = state.sustain !== 'waiting';
  byId<HTMLButtonElement>('skip-bend').disabled = state.bend !== 'waiting';
}

function pulseInputLamp(): void {
  const lamp = byId('input-lamp');
  window.clearTimeout(lampTimer);
  lamp.className = 'input-lamp is-live is-pulse';
  lamp.innerHTML = '<i></i> Receiving';
  lampTimer = window.setTimeout(() => {
    lamp.className = 'input-lamp is-live';
    lamp.innerHTML = '<i></i> Connected';
  }, 260);
}

function playFrequency(frequency: number, duration = 0.28, volume = 0.12): void {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function registerTimingHit(now: number): void {
  if (!timingActive) return;
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  timingTargets.forEach((target, index) => {
    if (timingHits[index] !== null) return;
    const distance = Math.abs(now - target);
    if (distance < bestDistance && distance <= 380) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  if (bestIndex < 0) return;
  timingHits[bestIndex] = now - (timingTargets[bestIndex] ?? now);
  document.querySelectorAll<HTMLElement>('#beat-strip i')[bestIndex]?.classList.add('is-hit');
  const hits = timingHits.filter((value): value is number => value !== null);
  byId('timing-readout').textContent = `${hits.length} of 6 taps captured`;
  if (hits.length === 6) finishTiming();
}

function handleMidiMessage(event: MIDIMessageEvent): void {
  const message = parseMidiMessage(event.data ?? []);
  if (message.kind === 'note-on') {
    state.input = 'passed';
    const name = midiNoteName(message.note);
    byId('note-name').textContent = name;
    byId('note-number').textContent = String(message.note);
    byId('velocity').textContent = String(message.velocity);
    byId('input-detail').textContent = `Signal received on channel ${message.channel}. Note labels use middle C = C4.`;
    mappingPassButton.disabled = false;
    mappingFailButton.disabled = false;
    if (message.note === 60) byId('mapping-detail').textContent = 'Middle C arrived as C4 · 60. Confirm that this is the key you played.';
    else byId('mapping-detail').textContent = `Latest note is ${name} · ${message.note}. Play middle C or confirm the displayed label.`;
    document.querySelectorAll('#piano > span').forEach((key) => key.classList.remove('is-note'));
    document.querySelector<HTMLElement>(`#piano > span[data-pc="${message.note % 12}"]`)?.classList.add('is-note');
    pulseInputLamp();
    if (soundUnlocked) playFrequency(440 * 2 ** ((message.note - 69) / 12), 0.2, Math.max(0.025, message.velocity / 900));
    registerTimingHit(performance.now());
    timingButton.disabled = !soundUnlocked;
    updateReadiness();
  }
  if (message.kind === 'control' && message.controller === 64 && message.value >= 64) {
    state.sustain = 'passed';
    updateControlDetails();
    updateReadiness();
  }
  if (message.kind === 'pitch-bend' && Math.abs(message.value - 8192) > 128) {
    state.bend = 'passed';
    updateControlDetails();
    updateReadiness();
  }
}

function bindInputs(): void {
  if (!midiAccess) return;
  let connected = 0;
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = handleMidiMessage;
    if (input.state === 'connected') connected += 1;
  }
  state.portCount = connected;
  byId('access-detail').textContent = connected > 0
    ? `${connected} input port${connected === 1 ? '' : 's'} available. Device names are intentionally hidden.`
    : 'Access was allowed, but no input port is visible. Reconnect and power on the keyboard.';
  connectButton.textContent = connected > 0 ? 'MIDI access granted' : 'Check again for a keyboard';
  connectButton.disabled = connected > 0;
  updateReadiness();
}

async function connectMidi(): Promise<void> {
  if (!navigator.requestMIDIAccess) return;
  connectButton.disabled = true;
  connectButton.textContent = 'Waiting for permission…';
  byId('access-detail').textContent = 'Your browser may show a MIDI permission prompt.';
  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: false, software: false });
    state.access = 'passed';
    midiAccess.onstatechange = bindInputs;
    bindInputs();
    showToast('MIDI permission granted. Play any key.');
  } catch {
    state.access = 'failed';
    connectButton.disabled = false;
    connectButton.textContent = 'Try MIDI access again';
    byId('access-detail').textContent = 'Access was blocked. Allow MIDI in the site permissions, then try again.';
    updateReadiness();
  }
}

async function unlockAudio(): Promise<void> {
  try {
    audioContext ??= new AudioContext();
    await audioContext.resume();
    soundUnlocked = true;
    const reported = typeof audioContext.outputLatency === 'number' ? audioContext.outputLatency : audioContext.baseLatency;
    state.outputLatencyMs = Number.isFinite(reported) ? Math.max(0, Math.round(reported * 1000)) : null;
    playFrequency(440, 0.55, 0.16);
    heardToneButton.disabled = false;
    noToneButton.disabled = false;
    playToneButton.textContent = 'Play tone again';
    timingButton.disabled = state.input !== 'passed';
    byId('audio-detail').textContent = state.outputLatencyMs === null
      ? 'Test tone played. This browser does not report output delay.'
      : `Test tone played. Browser-reported output delay: ${state.outputLatencyMs} ms.`;
  } catch {
    state.audio = 'failed';
    byId('audio-detail').textContent = 'Audio could not start. Check tab permissions and the selected output device.';
    updateReadiness();
  }
}

function startTiming(): void {
  if (!soundUnlocked || state.input !== 'passed' || timingActive) return;
  timingTimers.forEach(window.clearTimeout);
  document.querySelectorAll('#beat-strip i').forEach((beat) => { beat.className = ''; });
  state.timing = 'waiting';
  state.timingMs = null;
  timingActive = true;
  timingButton.disabled = true;
  timingSkipButton.disabled = true;
  const now = performance.now();
  timingTargets = Array.from({ length: 6 }, (_, index) => now + 900 + index * 650);
  timingHits = Array<number | null>(6).fill(null);
  byId('timing-readout').textContent = 'Get ready… then tap each pulse';
  const beats = document.querySelectorAll<HTMLElement>('#beat-strip i');
  timingTargets.forEach((target, index) => {
    timingTimers.push(window.setTimeout(() => {
      beats[index]?.classList.add('is-cue');
      playFrequency(880, 0.055, 0.07);
      byId('timing-readout').textContent = `Pulse ${index + 1} of 6`;
    }, Math.max(0, target - now)));
  });
  timingTimers.push(window.setTimeout(finishTiming, (timingTargets[5] ?? now) - now + 500));
  updateReadiness();
}

function finishTiming(): void {
  if (!timingActive) return;
  timingActive = false;
  timingTimers.forEach(window.clearTimeout);
  const offsets = timingHits.filter((value): value is number => value !== null);
  const stats = calculateTapStats(offsets);
  timingButton.disabled = false;
  timingSkipButton.disabled = false;
  timingButton.textContent = 'Run 6 taps again';
  if (!stats || stats.count < 4) {
    state.timing = 'failed';
    state.timingMs = null;
    byId('timing-readout').textContent = `${stats?.count ?? 0} of 6 captured — try again`;
    showToast('Too few taps were captured. Keep one key press near each pulse.');
  } else {
    state.timing = 'passed';
    state.timingMs = stats.meanAbsoluteMs;
    const direction = stats.meanOffsetMs < -15 ? 'early' : stats.meanOffsetMs > 15 ? 'late' : 'centered';
    byId('timing-readout').textContent = `±${stats.meanAbsoluteMs} ms · ${stats.rating} · ${direction}`;
    showToast(`Tap alignment captured: ±${stats.meanAbsoluteMs} ms.`);
  }
  updateReadiness();
}

function downloadSupportCard(): void {
  const result = cardResult();
  const svg = supportCardSvg(result);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'midi-first-note-support-card.svg';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Redacted SVG support card downloaded.');
}

async function copyResult(): Promise<void> {
  const text = supportSummary(cardResult());
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
  showToast('Redacted result copied.');
}

function initializeBrowserState(): void {
  const support = byId('browser-support');
  if (navigator.requestMIDIAccess) {
    support.textContent = '● Web MIDI supported';
    support.classList.add('is-supported');
  } else {
    support.textContent = '× Web MIDI unavailable';
    support.classList.add('is-unsupported');
    state.access = 'unsupported';
    connectButton.disabled = true;
    connectButton.textContent = 'MIDI unavailable in this browser';
    byId('access-detail').textContent = 'Open this page in current Chrome, Edge, or Opera. Safari and Firefox do not currently expose Web MIDI.';
  }
  updateReadiness();
}

connectButton.addEventListener('click', connectMidi);
mappingPassButton.addEventListener('click', () => {
  state.mapping = 'passed';
  byId('mapping-detail').textContent = 'Pitch label confirmed. MIDI 60 is shown as C4 in this tool.';
  updateReadiness();
});
mappingFailButton.addEventListener('click', () => {
  state.mapping = 'failed';
  byId('mapping-detail').textContent = 'Reset the keyboard’s octave/transpose control to zero. If only the octave name differs, compare MIDI number 60.';
  updateReadiness();
});
byId('skip-sustain').addEventListener('click', () => { state.sustain = 'skipped'; updateControlDetails(); updateReadiness(); });
byId('skip-bend').addEventListener('click', () => { state.bend = 'skipped'; updateControlDetails(); updateReadiness(); });
playToneButton.addEventListener('click', unlockAudio);
heardToneButton.addEventListener('click', () => { state.audio = 'passed'; byId('audio-detail').textContent = 'Sound confirmed. Incoming notes will now play a short local synth tone.'; updateReadiness(); });
noToneButton.addEventListener('click', () => { state.audio = 'failed'; byId('audio-detail').textContent = 'No sound confirmed. Check tab mute, system volume, and output selection, then play the tone again.'; updateReadiness(); });
timingButton.addEventListener('click', startTiming);
timingSkipButton.addEventListener('click', () => { state.timing = 'skipped'; state.timingMs = null; byId('timing-readout').textContent = 'Marked as skipped'; updateReadiness(); });
byId('download-card').addEventListener('click', downloadSupportCard);
byId('copy-result').addEventListener('click', copyResult);

const offlineBanner = byId('offline-banner');
const updateOnlineState = () => { offlineBanner.hidden = navigator.onLine; };
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();
initializeBrowserState();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
}
