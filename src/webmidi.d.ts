interface MIDIMessageEvent extends Event {
  readonly data: Uint8Array;
}

interface MIDIInput {
  readonly id: string;
  readonly state: 'connected' | 'disconnected';
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIAccess extends EventTarget {
  readonly inputs: Map<string, MIDIInput>;
  onstatechange: ((event: Event) => void) | null;
}

interface Navigator {
  requestMIDIAccess?: (options?: { sysex?: boolean; software?: boolean }) => Promise<MIDIAccess>;
}
