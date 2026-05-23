export interface SynthPreset {
  id: string;
  name: string;
  category: string;
  type: OscillatorType;
  octaveOffset: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export const CORE_PRESETS: SynthPreset[] = [
  { id: 'lead1', name: 'Pulse Wave', category: 'Lead', type: 'square', octaveOffset: 0, attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
  { id: 'lead2', name: 'Sawtooth Sync', category: 'Lead', type: 'sawtooth', octaveOffset: 0, attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
  { id: 'bass1', name: 'Sub-Oscillator', category: 'Bass', type: 'triangle', octaveOffset: -1, attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.4 },
  { id: 'bass2', name: 'Acid Bass', category: 'Bass', type: 'sawtooth', octaveOffset: -1, attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.1 },
  { id: 'retro1', name: 'Square Chip', category: 'Retro', type: 'square', octaveOffset: 0, attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 },
  { id: 'retro2', name: 'Atari Dream', category: 'Retro', type: 'triangle', octaveOffset: 1, attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 },
  { id: 'pad1', name: 'Soft Pad', category: 'Pad', type: 'sine', octaveOffset: 0, attack: 0.4, decay: 0.5, sustain: 0.8, release: 1.2 },
  { id: 'pluck1', name: 'Harp Pluck', category: 'Pluck', type: 'triangle', octaveOffset: 1, attack: 0.005, decay: 0.2, sustain: 0.0, release: 0.3 },
];

export const PIANO_KEYS = [
  { id: 'C4', label: 'C', keyBind: 'a', freq: 261.63, type: 'white' },
  { id: 'Db4', label: 'C#', keyBind: 'w', freq: 277.18, type: 'black' },
  { id: 'D4', label: 'D', keyBind: 's', freq: 293.66, type: 'white' },
  { id: 'Eb4', label: 'D#', keyBind: 'e', freq: 311.13, type: 'black' },
  { id: 'E4', label: 'E', keyBind: 'd', freq: 329.63, type: 'white' },
  { id: 'F4', label: 'F', keyBind: 'f', freq: 349.23, type: 'white' },
  { id: 'Gb4', label: 'F#', keyBind: 't', freq: 369.99, type: 'black' },
  { id: 'G4', label: 'G', keyBind: 'g', freq: 392.00, type: 'white' },
  { id: 'Ab4', label: 'G#', keyBind: 'y', freq: 415.30, type: 'black' },
  { id: 'A4', label: 'A', keyBind: 'h', freq: 440.00, type: 'white' },
  { id: 'Bb4', label: 'A#', keyBind: 'u', freq: 466.16, type: 'black' },
  { id: 'B4', label: 'B', keyBind: 'j', freq: 493.88, type: 'white' },
  { id: 'C5', label: 'C', keyBind: 'k', freq: 523.25, type: 'white' },
];

export const DRUM_PADS = [
  { id: 'mod', label: 'VIBE MOD', keyBind: '' },
  { id: 'kick', label: 'KICK', keyBind: 'z' },
  { id: 'snare', label: 'SNARE', keyBind: 'x' },
  { id: 'hatCl', label: 'HAT CL', keyBind: 'c' },
  { id: 'hatOp', label: 'HAT OP', keyBind: 'v' },
  { id: 'crush', label: 'BIT CRUSH', keyBind: '' },
  { id: 'perc1', label: 'PERC 1', keyBind: 'b' },
  { id: 'perc2', label: 'PERC 2', keyBind: 'n' },
  { id: 'clap', label: 'CLAP', keyBind: 'm' },
  { id: 'fx', label: 'FX LOOP', keyBind: ',' },
];
