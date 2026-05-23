import { SynthPreset } from './constants';

class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  synthGain: GainNode | null = null;
  bassGain: GainNode | null = null;
  drumGain: GainNode | null = null;
  activeNotes: Map<string, { osc?: OscillatorNode, gain: GainNode, preset?: SynthPreset, baseFrequency: number }> = new Map();
  noiseBuffer: AudioBuffer | null = null;
  
  analyser: AnalyserNode | null = null;
  dest: MediaStreamAudioDestinationNode | null = null;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  
  eqLow: BiquadFilterNode | null = null;
  eqMid: BiquadFilterNode | null = null;
  eqHigh: BiquadFilterNode | null = null;
  
  delayNode: DelayNode | null = null;
  delayFeedback: GainNode | null = null;
  delayWet: GainNode | null = null;
  reverbNode: ConvolverNode | null = null;
  reverbWet: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.synthGain = this.ctx.createGain();
      this.bassGain = this.ctx.createGain();
      this.drumGain = this.ctx.createGain();
      
      this.masterGain.gain.value = 0.8;
      this.synthGain.gain.value = 0.8;
      this.bassGain.gain.value = 0.8;
      this.drumGain.gain.value = 0.8;
      
      this.synthGain.connect(this.masterGain);
      this.bassGain.connect(this.masterGain);
      this.drumGain.connect(this.masterGain);
      this.noiseBuffer = this.createNoiseBuffer();

      // Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.7;

      // EQ Nodes
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.value = 320;
      this.eqLow.gain.value = 0;

      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = 'peaking';
      this.eqMid.frequency.value = 1000;
      this.eqMid.Q.value = 0.5;
      this.eqMid.gain.value = 0;

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.value = 3200;
      this.eqHigh.gain.value = 0;

      // Connect EQ chain
      this.masterGain.connect(this.eqLow);
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);

      // Effects Nodes
      this.delayNode = this.ctx.createDelay(3.0);
      this.delayNode.delayTime.value = 0.4;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.4;
      this.delayWet = this.ctx.createGain();
      this.delayWet.gain.value = 0;

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayWet);
      this.delayWet.connect(this.analyser);

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.createReverbBuffer(2.5);
      this.reverbWet = this.ctx.createGain();
      this.reverbWet.gain.value = 0;

      this.reverbNode.connect(this.reverbWet);
      this.reverbWet.connect(this.analyser);

      // Main Routing: EQ High -> [Analyser, Delay, Reverb]
      this.eqHigh.connect(this.analyser);
      this.eqHigh.connect(this.delayNode);
      this.eqHigh.connect(this.reverbNode);
      this.analyser.connect(this.ctx.destination);
      
      this.dest = this.ctx.createMediaStreamDestination();
      this.analyser.connect(this.dest);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEffects(delayMix: number, reverbMix: number) {
    if (this.delayWet && this.ctx) this.delayWet.gain.setTargetAtTime(delayMix, this.ctx.currentTime, 0.05);
    if (this.reverbWet && this.ctx) this.reverbWet.gain.setTargetAtTime(reverbMix, this.ctx.currentTime, 0.05);
  }

  setEQ(low: number, mid: number, high: number) {
    if (this.eqLow && this.ctx) this.eqLow.gain.setTargetAtTime(low, this.ctx.currentTime, 0.05);
    if (this.eqMid && this.ctx) this.eqMid.gain.setTargetAtTime(mid, this.ctx.currentTime, 0.05);
    if (this.eqHigh && this.ctx) this.eqHigh.gain.setTargetAtTime(high, this.ctx.currentTime, 0.05);
  }

  getVisualizerLevel() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return (sum / data.length) / 255.0;
  }

  getVisualizerFrequencyData(array: Uint8Array) {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(array);
  }

  getVisualizerTimeDomainData(array: Uint8Array) {
    if (!this.analyser) return;
    this.analyser.getByteTimeDomainData(array);
  }

  getVisualizerBinCount() {
    return this.analyser ? this.analyser.frequencyBinCount : 0;
  }

  startRecording() {
    this.init();
    if (!this.dest) return;
    this.audioChunks = [];
    // Use webm generic mime for widespread support in Chrome/Firefox outputting raw stream
    this.mediaRecorder = new MediaRecorder(this.dest.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve('');
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(URL.createObjectURL(blob));
      };
      this.mediaRecorder.stop();
    });
  }

  setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setMixerVolume(group: 'synth' | 'bass' | 'drum', val: number) {
    if (!this.ctx) return;
    const node = group === 'synth' ? this.synthGain : group === 'bass' ? this.bassGain : this.drumGain;
    if (node) node.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
  }

  setPitchBend(val: number) {
    // val is -1 to 1. Multiply by 2 for ±2 semitones.
    if (!this.ctx) return;
    const semitones = val * 2;
    const factor = Math.pow(2, semitones / 12);
    const now = this.ctx.currentTime;
    
    this.activeNotes.forEach(({ osc, preset, baseFrequency }) => {
      if (osc && preset) {
        const freqOffset = Math.pow(2, preset.octaveOffset);
        osc.frequency.setTargetAtTime(baseFrequency * freqOffset * factor, now, 0.01);
      }
    });
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  createReverbBuffer(duration: number, decay: number = 3.0) {
    if (!this.ctx) return null;
    const length = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const channel = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  setReverbEnvironment(env: string) {
    if (!this.ctx || !this.reverbNode) return;
    let duration = 2.5;
    let decay = 3.0;
    switch (env) {
      case 'Small Room': duration = 0.5; decay = 5.0; break;
      case 'Studio': duration = 1.2; decay = 3.5; break;
      case 'Warehouse': duration = 3.0; decay = 2.0; break;
      case 'Cathedral': duration = 5.0; decay = 1.5; break;
    }
    this.reverbNode.buffer = this.createReverbBuffer(duration, decay);
  }

  playPresetTone(noteId: string, frequency: number, preset: SynthPreset, pitchBendVal: number = 0) {
    this.init();
    if (!this.ctx || !this.synthGain || !this.bassGain) return;
    
    this.stopTone(noteId);

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    const isBass = preset.category?.toLowerCase().includes('bass');
    gainNode.connect(isBass ? this.bassGain : this.synthGain);

    osc.connect(gainNode);

    osc.type = preset.type;
    const freqOffset = Math.pow(2, preset.octaveOffset);
    
    const semitones = pitchBendVal * 2;
    const factor = Math.pow(2, semitones / 12);
    
    osc.frequency.setValueAtTime(frequency * freqOffset * factor, this.ctx.currentTime);
    
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + preset.attack);
    gainNode.gain.setTargetAtTime(preset.sustain, now + preset.attack, preset.decay);

    osc.start(now);
    this.activeNotes.set(noteId, { osc, gain: gainNode, preset, baseFrequency: frequency });
  }

  stopTone(noteId: string) {
    const note = this.activeNotes.get(noteId);
    if (!note || !this.ctx) return;

    const now = this.ctx.currentTime;
    if (note.gain) {
      const release = note.preset ? note.preset.release : 0.3;
      note.gain.gain.cancelScheduledValues(now);
      note.gain.gain.setValueAtTime(note.gain.gain.value, now);
      note.gain.gain.setTargetAtTime(0.0001, now, release / 3.0);
    }
    
    if (note.osc) {
      note.osc.stop(now + (note.preset ? note.preset.release : 0.5));
    }
    
    this.activeNotes.delete(noteId);
  }

  playDrum(type: string, drumKit: string = '808', customSample?: AudioBuffer | null) {
    this.init();
    if (!this.ctx || !this.drumGain) return;
    const t = this.ctx.currentTime;

    // Handle custom sample override for clap
    if (type === 'clap' && customSample) {
        const source = this.ctx.createBufferSource();
        source.buffer = customSample;
        source.connect(this.drumGain);
        source.start(t);
        return;
    }

    const gain = this.ctx.createGain();
    gain.connect(this.drumGain);

    if (type === 'kick' || type === 'perc1' || type === 'perc2' || type === 'mod') {
      const osc = this.ctx.createOscillator();
      osc.connect(gain);
      
      let startFreq = 150;
      let dur = 0.4;
      if (type === 'kick') {
          startFreq = drumKit === 'acoustic' ? 100 : drumKit === 'electro' ? 200 : 150;
          dur = drumKit === 'acoustic' ? 0.3 : drumKit === 'electro' ? 0.2 : 0.4;
      } else {
          startFreq = type === 'perc1' ? 400 : type === 'mod' ? 80 : 300;
          dur = 0.2;
      }
      
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + dur);
      
      gain.gain.setValueAtTime(1.5, t); // extra punch
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
      
      osc.start(t);
      osc.stop(t + dur);
    } else if (this.noiseBuffer) {
        // Noise-based percussion
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        
        noise.connect(filter);
        filter.connect(gain);
        
        if (type === 'hatCl' || type === 'hatOp') {
            filter.type = drumKit === 'electro' ? 'bandpass' : 'highpass';
            filter.frequency.value = drumKit === 'acoustic' ? 6000 : drumKit === 'electro' ? 9000 : 8000;
            gain.gain.setValueAtTime(0.8, t);
            const dur = type === 'hatOp' ? (drumKit === 'acoustic' ? 0.5 : 0.4) : (drumKit === 'electro' ? 0.03 : 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            noise.start(t);
            noise.stop(t + dur);
        } else if (type === 'snare' || type === 'clap' || type === 'crush' || type === 'fx') {
            filter.type = 'bandpass';
            filter.frequency.value = type === 'snare' ? (drumKit==='electro' ? 1200 : drumKit==='acoustic' ? 800 : 1000) : type === 'crush' ? 400 : 2500;
            const dur = type === 'snare' ? (drumKit==='electro' ? 0.15 : 0.25) : type === 'fx' ? 0.8 : 0.15;
            gain.gain.setValueAtTime(1.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            noise.start(t);
            noise.stop(t + dur);
            
            // Add tone body to snare
            if (type === 'snare') {
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = drumKit === 'electro' ? 'square' : 'triangle';
                osc.connect(oscGain);
                oscGain.connect(this.drumGain);
                osc.frequency.setValueAtTime(drumKit === 'acoustic' ? 200 : 250, t);
                oscGain.gain.setValueAtTime(0.6, t);
                oscGain.gain.exponentialRampToValueAtTime(0.01, t + (drumKit === 'electro' ? 0.1 : 0.15));
                osc.start(t);
                osc.stop(t + (drumKit === 'electro' ? 0.1 : 0.15));
            }
        }
    }
  }
}

export const audio = new AudioEngine();
