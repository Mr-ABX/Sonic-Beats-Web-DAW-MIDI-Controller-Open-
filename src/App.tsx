import { useEffect, useState, useCallback, useRef } from 'react';
import { audio } from './lib/audioEngine';
import { PIANO_KEYS, DRUM_PADS, CORE_PRESETS, SynthPreset } from './lib/constants';
import { Play, Square, ListMusic, Settings, Circle, Download, Repeat, Save, Undo2, Redo2, Activity, BarChart2 } from 'lucide-react';
import { CommandHistory } from './lib/useCommandHistory';
import MidiWriter from 'midi-writer-js';

import { SettingsKeyMapper } from './components/SettingsKeyMapper';

const emptySequence = () => ({
  kick:  Array(16).fill(false),
  snare: Array(16).fill(false),
  hatCl: Array(16).fill(false),
  clap:  Array(16).fill(false),
});

export default function App() {
  const [presets, setPresets] = useState<SynthPreset[]>(() => {
    const saved = localStorage.getItem('vibe_midi_presets');
    return saved ? JSON.parse(saved) : CORE_PRESETS;
  });
  const [activePreset, setActivePreset] = useState<SynthPreset>(presets[0]);
  const activePresetRef = useRef(activePreset);
  useEffect(() => { activePresetRef.current = activePreset; }, [activePreset]);

  // Sequencer State & Banks
  const [showSeq, setShowSeq] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  const [activeBank, setActiveBank] = useState<number>(0);
  const [sequenceBanks, setSequenceBanks] = useState<Record<string, boolean[]>[]>([
    {
      kick:  [true, false, false, false,  true, false, false, false,  true, false, false, false,  true, false, false, false],
      snare: [false, false, false, false,  true, false, false, false,  false, false, false, false,  true, false, false, false],
      hatCl: [true, false, true, false,  true, false, true, false,  true, false, true, false,  true, false, true, false],
      clap:  [false, false, false, false,  false, false, false, false,  false, false, false, false,  false, false, false, false],
    },
    emptySequence(), emptySequence(), emptySequence()
  ]);

  const sequence = sequenceBanks[activeBank];
  const sequenceRef = useRef(sequence);
  useEffect(() => { sequenceRef.current = sequenceBanks[activeBank]; }, [sequenceBanks, activeBank]);

  // Command History
  const historyRef = useRef(new CommandHistory(10));
  const [, setHistoryTick] = useState(0); // For forcing re-renders on undo/redo
  
  const pushCommand = (execute: () => void, undo: () => void) => {
    historyRef.current.execute({ execute, undo });
    setHistoryTick(t => t + 1);
  };
  
  const handleUndo = () => { historyRef.current.undo(); setHistoryTick(t => t + 1); };
  const handleRedo = () => { historyRef.current.redo(); setHistoryTick(t => t + 1); };

  const [volume, setVolume] = useState(0.8);
  const [synthVol, setSynthVol] = useState(0.8);
  const [bassVol, setBassVol] = useState(0.8);
  const [drumVol, setDrumVol] = useState(0.8);
  const [pitchBend, setPitchBend] = useState(0);
  
  const [delayMix, setDelayMix] = useState(0);
  const [reverbMix, setReverbMix] = useState(0);
  const [reverbEnv, setReverbEnv] = useState('Studio');
  
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  const [isQuantize, setIsQuantize] = useState(false);
  const [isArp, setIsArp] = useState(false);
  const [appTheme, setAppTheme] = useState('neon-cyber');
  
  const [visualizerMode, setVisualizerMode] = useState<'Pulse' | 'Oscilloscope' | 'Spectrum'>('Pulse');
  const [pulse, setPulse] = useState(0);
  const pulseRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [presetCategory, setPresetCategory] = useState<string>('All');

  // MIDI Learn
  const [midiLearnMode, setMidiLearnMode] = useState<'waiting' | 'listening' | null>(null);
  const [midiLearnTarget, setMidiLearnTarget] = useState<string | null>(null);
  const [midiMappings, setMidiMappings] = useState<Record<number, string>>({
    7: 'volume', 12: 'delayMix', 13: 'reverbMix'
  });

  const midiMappingsRef = useRef(midiMappings);
  useEffect(() => { midiMappingsRef.current = midiMappings; }, [midiMappings]);

  const handleMidiSelect = (target: string) => {
    if (midiLearnMode === 'waiting') {
      setMidiLearnTarget(target);
      setMidiLearnMode('listening');
    }
  };

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(midiAccess => {
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = (message) => {
            const command = message.data[0];
            const noteOrCc = message.data[1];
            const velocityOrVal = message.data[2];

            // CC message
            if (command >= 176 && command <= 191) {
              if (midiLearnMode === 'listening' && midiLearnTarget) {
                setMidiMappings(prev => ({ ...prev, [noteOrCc]: midiLearnTarget }));
                setMidiLearnMode(null);
                setMidiLearnTarget(null);
                return;
              }

              const target = midiMappingsRef.current[noteOrCc];
              if (target) {
                const normVal = velocityOrVal / 127;
                // Direct state mutations based on string keys are tricky without switch
                switch(target) {
                  case 'volume': setVolume(normVal); break;
                  case 'synthVol': setSynthVol(normVal); break;
                  case 'bassVol': setBassVol(normVal); break;
                  case 'drumVol': setDrumVol(normVal); break;
                  case 'delayMix': setDelayMix(normVal); break;
                  case 'reverbMix': setReverbMix(normVal); break;
                  case 'eqLow': setEqLow((normVal * 24) - 12); break;
                  case 'eqMid': setEqMid((normVal * 24) - 12); break;
                  case 'eqHigh': setEqHigh((normVal * 24) - 12); break;
                }
              }
            }
          };
        }
      }).catch(console.error);
    }
  }, [midiLearnMode, midiLearnTarget]);

  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const activeNotesRef = useRef(activeNotes);
  useEffect(() => { activeNotesRef.current = activeNotes; }, [activeNotes]);

  // Effects & Volume syncing
  useEffect(() => { audio.setMasterVolume(volume); }, [volume]);
  useEffect(() => { audio.setMixerVolume('synth', synthVol); }, [synthVol]);
  useEffect(() => { audio.setMixerVolume('bass', bassVol); }, [bassVol]);
  useEffect(() => { audio.setMixerVolume('drum', drumVol); }, [drumVol]);
  useEffect(() => { audio.setPitchBend(pitchBend); }, [pitchBend]);
  
  useEffect(() => { audio.setEffects(delayMix, reverbMix); }, [delayMix, reverbMix]);
  useEffect(() => { audio.setReverbEnvironment(reverbEnv); }, [reverbEnv]);
  useEffect(() => { audio.setEQ(eqLow, eqMid, eqHigh); }, [eqLow, eqMid, eqHigh]);

  // Visualizer loop
  useEffect(() => {
    let req: number;
    const animate = () => {
      const level = audio.getVisualizerLevel();
      pulseRef.current += (level - pulseRef.current) * 0.3; // smooth dampening
      setPulse(pulseRef.current);

      if (canvasRef.current && visualizerMode !== 'Pulse') {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           const bins = audio.getVisualizerBinCount();
           if (bins > 0) {
              const data = new Uint8Array(bins);
              if (visualizerMode === 'Oscilloscope') {
                audio.getVisualizerTimeDomainData(data);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#00d0ff';
                ctx.beginPath();
                const sliceWidth = canvas.width / bins;
                let x = 0;
                for (let i = 0; i < bins; i++) {
                  const v = data[i] / 128.0;
                  const y = (v * canvas.height) / 2;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                  x += sliceWidth;
                }
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
              } else if (visualizerMode === 'Spectrum') {
                audio.getVisualizerFrequencyData(data);
                ctx.fillStyle = '#c934ff';
                const barWidth = (canvas.width / bins) * 2.5;
                let x = 0;
                for (let i = 0; i < bins; i++) {
                  const barHeight = (data[i] / 255) * canvas.height;
                  ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                  x += barWidth + 1;
                }
              }
           }
        }
      }
      req = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(req);
  }, [visualizerMode]);

  // Sequencer loop
  useEffect(() => {
    if (!isPlaying) return;
    let step = 0;
    setCurrentStep(0);
    const intervalTime = (60 / bpm) / 4 * 1000;
    
    const intervalId = setInterval(() => {
      ['kick', 'snare', 'hatCl', 'clap'].forEach(drum => {
        if (sequenceRef.current[drum][step]) {
           audio.playDrum(drum);
           // Trigger drum visual pulse manually or let audio engine pickup
        }
      });
      setCurrentStep(step);
      step = (step + 1) % 16;
    }, intervalTime);
    
    return () => clearInterval(intervalId);
  }, [isPlaying, bpm]);

  const toggleStep = (drum: string, index: number) => {
    const newVal = !sequenceBanks[activeBank][drum][index];
    const targetBank = activeBank;

    const doToggle = (val: boolean) => {
      setSequenceBanks(prev => {
        const next = [...prev];
        next[targetBank] = { ...next[targetBank] };
        next[targetBank][drum] = [...next[targetBank][drum]];
        next[targetBank][drum][index] = val;
        return next;
      });
    };

    pushCommand(() => doToggle(newVal), () => doToggle(!newVal));
  };

  const handleExportSequence = () => {
    try {
      const track1 = new MidiWriter.Track();
      track1.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 1}));
      // Standard MIDI mapping
      // Kick: 36, Snare: 38, Hat Closed: 42, Clap: 39
      const map: Record<string, number> = { kick: 36, snare: 38, hatCl: 42, clap: 39 };
      
      const noteEvents: MidiWriter.NoteEvent[] = [];
      const tickPer16th = 128; // Ticks per beat = 128 -> a 16th note = 128 ticks
      
      ['kick', 'snare', 'hatCl', 'clap'].forEach(drum => {
        sequenceRef.current[drum].forEach((isActive, i) => {
          if (isActive) {
            noteEvents.push(new MidiWriter.NoteEvent({
              pitch: [map[drum]],
              duration: '16',
              startTick: i * tickPer16th,
              channel: 10,
              velocity: 100
            }));
          }
        });
      });
      
      track1.addEvent(noteEvents);
      const write = new MidiWriter.Writer(track1);
      const dataUri = write.dataUri();
      
      const a = document.createElement('a');
      a.setAttribute("href", dataUri);
      a.setAttribute("download", "sonic_beats.mid");
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch(err) {
      console.warn("MIDI Export failed", err);
    }
  };

  const tapTimes = useRef<number[]>([]);
  const handleTapTempo = () => {
    const now = Date.now();
    tapTimes.current.push(now);
    if (tapTimes.current.length > 4) tapTimes.current.shift();
    
    if (tapTimes.current.length >= 2) {
       const deltas = [];
       for (let i = 1; i < tapTimes.current.length; i++) {
          deltas.push(tapTimes.current[i] - tapTimes.current[i-1]);
       }
       const avgDelta = deltas.reduce((a, b) => a + b) / deltas.length;
       const nextBpm = Math.round(60000 / avgDelta);
       setBpm(Math.min(200, Math.max(60, nextBpm)));
    }
  };

  // Settings & Audio Export State
  const [showSettings, setShowSettings] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDownloadUrl, setAudioDownloadUrl] = useState<string | null>(null);

  const toggleAudioRecord = async () => {
    if (isRecordingAudio) {
      setIsRecordingAudio(false);
      const url = await audio.stopRecording();
      setAudioDownloadUrl(url);
    } else {
      audio.startRecording();
      setIsRecordingAudio(true);
      setAudioDownloadUrl(null);
    }
  };

  // Live Looper State 
  const [isLoopRecording, setIsLoopRecording] = useState(false);
  const isLoopRecordingRef = useRef(isLoopRecording);
  useEffect(() => { isLoopRecordingRef.current = isLoopRecording; }, [isLoopRecording]);

  const [isLooping, setIsLooping] = useState(false);
  const liveLoopEvents = useRef<{type: string, id: string, freq: number, offset: number, preset?: any}[]>([]);
  const loopStartOffset = useRef(0);

  const toggleLiveLoopRecord = () => {
    if (!isLoopRecording) {
      // Start recording phase (reset loop timestamp context)
      loopStartOffset.current = Date.now();
      liveLoopEvents.current = [];
      setIsLoopRecording(true);
      setIsLooping(false); 
    } else {
      // Stop recording, automatically start looping
      setIsLoopRecording(false);
      if (liveLoopEvents.current.length > 0) setIsLooping(true);
    }
  };

  const clearLoop = () => {
    liveLoopEvents.current = [];
    setIsLoopRecording(false);
    setIsLooping(false);
  };

  // Live Looper Playback Engine
  useEffect(() => {
    if (!isLooping) return;
    let timeouts: number[] = [];
    
    const playEvents = () => {
       liveLoopEvents.current.forEach(ev => {
          const t = window.setTimeout(() => {
             if (ev.type === 'drum') {
                audio.playDrum(ev.id);
                addNote(ev.id); setTimeout(() => removeNote(ev.id), 100);
             } else {
                audio.playPresetTone(ev.id, ev.freq, ev.preset || activePresetRef.current);
                addNote(ev.id); setTimeout(() => removeNote(ev.id), 200);
             }
          }, ev.offset);
          timeouts.push(t);
       });
    };
    
    playEvents(); // play immediately on tick 0
    const intervalId = setInterval(playEvents, 4000); // hardcoded 4-second loop window
    
    return () => {
       clearInterval(intervalId);
       timeouts.forEach(clearTimeout);
    };
  }, [isLooping]);

  const addNote = useCallback((noteId: string) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.add(noteId);
      return next;
    });
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  }, []);

  const quantizeRef = useRef(false);
  useEffect(() => { quantizeRef.current = isQuantize; }, [isQuantize]);
  const pitchBendRef = useRef(0);
  useEffect(() => { pitchBendRef.current = pitchBend; }, [pitchBend]);
  const isArpRef = useRef(false);
  useEffect(() => { isArpRef.current = isArp; }, [isArp]);
  const currentBpmRef = useRef(bpm);
  useEffect(() => { currentBpmRef.current = bpm; }, [bpm]);

  const triggerNote = useCallback((noteId: string, freq: number) => {
    if (!activeNotesRef.current.has(noteId)) {
      if (!isArpRef.current) {
        audio.playPresetTone(noteId, freq, activePresetRef.current, pitchBendRef.current);
      }
      addNote(noteId);
      
      if (isLoopRecordingRef.current && !isArpRef.current) {
         const now = Date.now();
         let offset = now - loopStartOffset.current;
         while (offset >= 4000) offset -= 4000;
         if (quantizeRef.current) {
           const interval = (60000 / currentBpmRef.current) / 4;
           offset = Math.round(offset / interval) * interval;
         }
         liveLoopEvents.current.push({ type: 'note', id: noteId, freq, offset, preset: activePresetRef.current });
      }
    }
  }, [addNote]);

  const releaseNote = useCallback((noteId: string) => {
    if (activeNotesRef.current.has(noteId)) {
      if (!isArpRef.current) {
        audio.stopTone(noteId);
      }
      removeNote(noteId);
    }
  }, [removeNote]);

  const triggerDrum = useCallback((type: string) => {
    audio.playDrum(type);
    addNote(type);
    setTimeout(() => { removeNote(type); }, 150);

    if (isLoopRecordingRef.current) {
         const now = Date.now();
         let offset = now - loopStartOffset.current;
         while (offset >= 4000) offset -= 4000;
         if (quantizeRef.current) {
           const interval = (60000 / currentBpmRef.current) / 4;
           offset = Math.round(offset / interval) * interval;
         }
         liveLoopEvents.current.push({ type: 'drum', id: type, freq: 0, offset });
    }
  }, [addNote, removeNote]);

  // Arpeggiator Loop
  const arpIndexRef = useRef(0);
  useEffect(() => {
    let lastTime = document.timeline ? document.timeline.currentTime as number : performance.now();
    let arpAnimationId: number;
    
    const step = (time: DOMHighResTimeStamp) => {
      const interval = (60000 / currentBpmRef.current) / 4; // 16th note
      if (time - lastTime > interval) {
        lastTime = time;
        if (isArpRef.current && activeNotesRef.current.size > 0) {
           const notes = Array.from(activeNotesRef.current).filter((n) => typeof n === 'string' && (n as string).startsWith('note-')) as string[];
           if (notes.length > 0) {
             arpIndexRef.current = (arpIndexRef.current + 1) % notes.length;
             const noteId = notes[arpIndexRef.current] as string;
             const pKey = PIANO_KEYS.find(k => k.id === noteId);
             if (pKey) {
                audio.playPresetTone(noteId, pKey.freq, activePresetRef.current, pitchBendRef.current);
                setTimeout(() => { audio.stopTone(noteId); }, Math.min(interval * 0.8, 100)); // ensure note plays shortly then stops
             }
           }
        }
      }
      arpAnimationId = requestAnimationFrame(step);
    };
    
    arpAnimationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(arpAnimationId);
  }, []);

  // Key Bind State
  const [pianoKeyBinds, setPianoKeyBinds] = useState(() => {
    const saved = localStorage.getItem('vibe_piano_binds');
    return saved ? JSON.parse(saved) : PIANO_KEYS.map(k => ({ id: k.id, keyBind: k.keyBind }));
  });
  const [drumKeyBinds, setDrumKeyBinds] = useState(() => {
    const saved = localStorage.getItem('vibe_drum_binds');
    return saved ? JSON.parse(saved) : DRUM_PADS.map(d => ({ id: d.id, keyBind: d.keyBind }));
  });

  const pianoKeyBindsRef = useRef(pianoKeyBinds);
  useEffect(() => { pianoKeyBindsRef.current = pianoKeyBinds; }, [pianoKeyBinds]);
  const drumKeyBindsRef = useRef(drumKeyBinds);
  useEffect(() => { drumKeyBindsRef.current = drumKeyBinds; }, [drumKeyBinds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      
      const pianoBind = pianoKeyBindsRef.current.find((k: any) => k.keyBind === key);
      if (pianoBind) {
         const pKey = PIANO_KEYS.find(k => k.id === pianoBind.id);
         if (pKey) triggerNote(pKey.id, pKey.freq);
      }
      
      const drumBind = drumKeyBindsRef.current.find((k: any) => k.keyBind === key);
      if (drumBind) {
         const dKey = DRUM_PADS.find(d => d.id === drumBind.id);
         if (dKey) triggerDrum(dKey.id);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      const pianoBind = pianoKeyBindsRef.current.find((k: any) => k.keyBind === key);
      if (pianoBind) {
         const pKey = PIANO_KEYS.find(k => k.id === pianoBind.id);
         if (pKey) releaseNote(pKey.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerNote, releaseNote, triggerDrum]);

  // Preset saving
  const [isEditing, setIsEditing] = useState(false);
  
  const updatePresetField = (field: keyof SynthPreset, val: any) => {
    const oldVal = activePreset[field];
    const doUpdate = (v: any) => setActivePreset(p => ({ ...p, [field]: v }));
    pushCommand(() => doUpdate(val), () => doUpdate(oldVal));
  };
  
  const handleSavePreset = () => {
    const newPreset = { ...activePreset, id: 'cust-' + Date.now(), name: activePreset.name + ' (Mod)' };
    const updated = [...presets, newPreset];
    setPresets(updated);
    setActivePreset(newPreset);
    localStorage.setItem('vibe_midi_presets', JSON.stringify(updated));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans flex flex-col items-center justify-start p-4 md:p-6 selection:bg-[#c934ff]/30 overflow-y-auto" data-theme={appTheme}>
      
      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md p-6 flex flex-col gap-4 shadow-[#222_0_0_40px]">
            <div className="flex justify-between items-center border-b border-[#222] pb-4">
              <h2 className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><Settings className="w-5 h-5 text-[#00d0ff]" /> System Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#888] hover:text-white font-bold text-xl leading-none">&times;</button>
            </div>
            <div className="flex flex-col gap-4 py-2 flex-1 overflow-auto max-h-[70vh]">
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                 <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><ListMusic className="w-3 h-3 text-[#18a058]"/> Keyboard Mapping Config</h3>
                 <SettingsKeyMapper 
                    pianoBinds={pianoKeyBinds} 
                    drumBinds={drumKeyBinds}
                    onPianoChange={setPianoKeyBinds}
                    onDrumChange={setDrumKeyBinds}
                 />
              </div>
              
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                 <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><BarChart2 className="w-3 h-3 text-[#c934ff]"/> Master EQ</h3>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">Low</span>
                      <input type="range" min="-12" max="12" step="0.1" value={eqLow} onChange={e => setEqLow(parseFloat(e.target.value))} className="w-full h-1 accent-[#c934ff]" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">Mid</span>
                      <input type="range" min="-12" max="12" step="0.1" value={eqMid} onChange={e => setEqMid(parseFloat(e.target.value))} className="w-full h-1 accent-[#c934ff]" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">High</span>
                      <input type="range" min="-12" max="12" step="0.1" value={eqHigh} onChange={e => setEqHigh(parseFloat(e.target.value))} className="w-full h-1 accent-[#c934ff]" />
                    </div>
                 </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                 <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2">Interface Theme</h3>
                 <select value={appTheme} onChange={e => setAppTheme(e.target.value)} className="bg-[#111] text-[#00d0ff] text-[10px] p-2 border border-[#333] rounded uppercase font-bold focus:outline-none w-full">
                    <option value="neon-cyber">Neon Cyber</option>
                    <option value="classic-gold">Classic Gold</option>
                    <option value="industrial-green">Industrial Green</option>
                 </select>
              </div>

              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                 <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3 text-[#00d0ff]"/> MIDI Learn Mode</h3>
                 <p className="text-[#888] text-[9px] mb-3">Click 'Learn', then select a UI parameter like Volume or Delay, and move a physical knob on your MIDI controller to bind them.</p>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setMidiLearnMode(midiLearnMode ? null : 'waiting')}
                     className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors border ${midiLearnMode ? 'bg-[#c934ff]/20 text-[#c934ff] border-[#c934ff] animate-pulse' : 'bg-[#111] text-[#888] border-[#333] hover:text-white'}`}
                   >
                     {midiLearnMode === 'waiting' ? 'Waiting for UI Click...' : midiLearnMode === 'listening' ? 'Move MIDI Knob...' : 'Start MIDI Learn'}
                   </button>
                   <button onClick={() => setMidiMappings({})} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-[#111] border border-[#333] text-red-500 hover:bg-[#222]">Clear All</button>
                 </div>
                 
                 {Object.keys(midiMappings).length > 0 && (
                   <div className="mt-3">
                     <span className="text-[#555] text-[8px] font-mono tracking-widest uppercase mb-1 block">Active Mappings</span>
                     <div className="grid grid-cols-2 gap-2">
                       {Object.entries(midiMappings).map(([cc, target]) => (
                         <div key={cc} className="bg-[#111] border border-[#333] px-2 py-1 rounded text-[9px] font-mono text-[#00d0ff] flex justify-between items-center">
                           <span>CC {cc}</span>
                           <span className="text-[#888]">{target}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              <div className="bg-[#1a1a1a] border border-[#3088d4]/30 rounded-lg p-4 relative overflow-hidden shadow-inner mt-2">
                 <div className="absolute top-2 right-2 bg-[#00d0ff] text-[#000] text-[8px] font-bold px-2 py-0.5 rounded uppercase">MIDI Protocol</div>
                 <h3 className="text-[#00d0ff] text-xs font-bold uppercase mb-1">Hardware MIDI Cheat Sheet</h3>
                 <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[9px] uppercase tracking-widest text-[#888]">
                    <div className="bg-[#111] border border-[#222] p-2 rounded">
                       <p className="text-white mb-1.5 border-b border-[#333] inline-block pb-0.5">Control Changes (CC)</p>
                       <ul className="flex flex-col gap-1">
                         <li>CC 7 - Master Volume</li>
                         <li>CC 12 - Delay Mix</li>
                         <li>CC 13 - Reverb Mix</li>
                       </ul>
                    </div>
                    <div className="bg-[#111] border border-[#222] p-2 rounded">
                       <p className="text-white mb-1.5 border-b border-[#333] inline-block pb-0.5">Note Mapping (CH10)</p>
                       <ul className="flex flex-col gap-1">
                         <li>C3/36 - Kick</li>
                         <li>D3/38 - Snare</li>
                         <li>F#3/42 - Hat Closed</li>
                         <li>A#3/46 - Hat Open</li>
                       </ul>
                    </div>
                 </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-2 bg-[#222] text-[#fff] font-bold text-[10px] uppercase tracking-widest py-3 rounded-lg hover:bg-[#333] transition-colors border border-[#333]">
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* Main Container with Bento Box layout */}
      <div 
        className="w-full max-w-[1280px] relative transition-transform duration-75 flex flex-col gap-4 md:gap-6"
        style={{ transform: `scale(${1 + pulse * 0.005})` }}
      >
        
        {/* TOP BAR / HEADER BOX */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex justify-between items-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded shrink-0 bg-[#0d0d0d] flex items-center justify-center text-white font-bold text-sm tracking-widest transition-all duration-75 relative overflow-hidden border border-[#222]`}>
               {visualizerMode === 'Pulse' && <div className="absolute inset-0 bg-[#a120cc]" style={{ opacity: 0.2 + pulse, transform: `scale(${1 + pulse*0.5})` }} />}
               <canvas ref={canvasRef} width={48} height={48} className="absolute inset-0 w-full h-full" />
               <span className="relative z-10 mix-blend-difference text-[#fff]">SB</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 ml-1 md:ml-0">
                <h1 className="text-white text-sm md:text-base font-bold tracking-[0.15em] uppercase">Sonic Beats</h1>
                <span className="hidden sm:inline-block text-[10px] bg-[#2a1b32] text-[#c671f0] px-1.5 py-0.5 rounded font-mono tracking-wider font-semibold border border-[#3b2347]">V1.3 OS</span>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-1 md:ml-0 mt-1">
                <button onClick={() => setVisualizerMode('Pulse')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${visualizerMode === 'Pulse' ? 'border-[#00d0ff] text-[#00d0ff]' : 'border-[#333] text-[#555]'}`}>Pulse</button>
                <button onClick={() => setVisualizerMode('Oscilloscope')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${visualizerMode === 'Oscilloscope' ? 'border-[#00d0ff] text-[#00d0ff]' : 'border-[#333] text-[#555]'}`}>Scope</button>
                <button onClick={() => setVisualizerMode('Spectrum')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${visualizerMode === 'Spectrum' ? 'border-[#00d0ff] text-[#00d0ff]' : 'border-[#333] text-[#555]'}`}>Spec</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center gap-1 mx-2">
                 <button onClick={handleUndo} disabled={!historyRef.current.canUndo} className={`p-1.5 rounded transition-colors ${historyRef.current.canUndo ? 'text-white bg-[#222] hover:bg-[#333]' : 'text-[#444] bg-[#111] cursor-not-allowed'}`} title="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
                 <button onClick={handleRedo} disabled={!historyRef.current.canRedo} className={`p-1.5 rounded transition-colors ${historyRef.current.canRedo ? 'text-white bg-[#222] hover:bg-[#333]' : 'text-[#444] bg-[#111] cursor-not-allowed'}`} title="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
             </div>
             {audioDownloadUrl && (
               <a href={audioDownloadUrl} download="sonic-beats-mix.webm" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/50 hover:bg-[#00d0ff]/30 shadow-[0_0_10px_rgba(0,208,255,0.2)]">
                 <Download className="w-3 h-3 hidden sm:block" /> Get Mix
               </a>
             )}
             <button 
               onClick={toggleAudioRecord}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${isRecordingAudio ? 'bg-red-500 text-white border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-[#1a1a1a] text-[#888] border border-[#333] hover:bg-[#222]'}`}
             >
                <Circle className={`w-3 h-3 ${isRecordingAudio ? 'fill-current' : ''} hidden sm:block`} /> {isRecordingAudio ? 'Recording' : 'Rec Master'}
             </button>
             <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] text-[#888] border border-[#333] hover:bg-[#222] hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">
               <Settings className="w-3 h-3" /> <span className="hidden sm:block">Settings</span>
             </button>
          </div>
        </div>

        {/* BENTO GRID MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDE RAIL: TWEAKS & MIXER */}
          <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
            
            {/* Mixer Box */}
            <div className={`bg-[#111] border rounded-xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-colors ${midiLearnMode === 'waiting' ? 'border-[#00d0ff] ring-2 ring-[#00d0ff]/50' : 'border-[#222]'}`}>
              <div className="flex items-center gap-2 border-b border-[#222] pb-2">
                <Settings className="w-3 h-3 text-[#555]" />
                <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Mix Out</h2>
              </div>
              
              <div className="flex flex-col gap-1.5" onClick={() => handleMidiSelect('volume')}>
                <div className="flex justify-between items-center cursor-pointer">
                  <span className={`text-[9px] font-mono tracking-widest uppercase transition-colors ${midiLearnTarget === 'volume' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}>Master</span>
                  <span className="text-[#888] text-[9px] font-mono">{Math.round(volume * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden relative pointer-events-none sm:pointer-events-auto">
                  <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#7a18cc] via-[#c934ff] to-[#00d0ff]" style={{ width: `${volume * 100}%` }} />
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div className="flex flex-col group bg-[#1a1a1a] border border-[#2a2a2a] rounded overflow-hidden cursor-pointer" onClick={() => handleMidiSelect('synthVol')}>
                  <div className="bg-[#222] p-1"><span className={`text-[8px] font-mono uppercase tracking-widest transition-colors ${midiLearnTarget === 'synthVol' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}>SYN</span></div>
                  <div className="px-2 py-3 pointer-events-none sm:pointer-events-auto"><input type="range" min="0" max="1" step="0.01" value={synthVol} onChange={(e) => setSynthVol(parseFloat(e.target.value))} className="w-full h-1 accent-[#00d0ff] group-hover:scale-y-150 transition-transform" /></div>
                </div>
                <div className="flex flex-col group bg-[#1a1a1a] border border-[#2a2a2a] rounded overflow-hidden cursor-pointer" onClick={() => handleMidiSelect('bassVol')}>
                  <div className="bg-[#222] p-1"><span className={`text-[8px] font-mono uppercase tracking-widest transition-colors ${midiLearnTarget === 'bassVol' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}>BAS</span></div>
                  <div className="px-2 py-3 pointer-events-none sm:pointer-events-auto"><input type="range" min="0" max="1" step="0.01" value={bassVol} onChange={(e) => setBassVol(parseFloat(e.target.value))} className="w-full h-1 accent-[#c934ff] group-hover:scale-y-150 transition-transform" /></div>
                </div>
                <div className="flex flex-col group bg-[#1a1a1a] border border-[#2a2a2a] rounded overflow-hidden cursor-pointer" onClick={() => handleMidiSelect('drumVol')}>
                  <div className="bg-[#222] p-1"><span className={`text-[8px] font-mono uppercase tracking-widest transition-colors ${midiLearnTarget === 'drumVol' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}>DRM</span></div>
                  <div className="px-2 py-3 pointer-events-none sm:pointer-events-auto"><input type="range" min="0" max="1" step="0.01" value={drumVol} onChange={(e) => setDrumVol(parseFloat(e.target.value))} className="w-full h-1 accent-[#fff] group-hover:scale-y-150 transition-transform" /></div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[#555] text-[9px] font-mono tracking-widest uppercase">Global Effects Master</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded p-2 gap-2 cursor-pointer" onClick={() => handleMidiSelect('delayMix')}>
                    <span className={`text-[8px] font-bold tracking-wider uppercase transition-colors ${midiLearnTarget === 'delayMix' ? 'text-[#00d0ff] animate-pulse' : 'text-[#666]'}`}>Delay</span>
                    <input type="range" min="0" max="1" step="0.01" value={delayMix} onChange={(e) => setDelayMix(parseFloat(e.target.value))} className="w-full h-1 accent-[#00d0ff] pointer-events-none sm:pointer-events-auto" />
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded p-1.5 gap-1.5 cursor-pointer" onClick={() => handleMidiSelect('reverbMix')}>
                    <select value={reverbEnv} onChange={e => setReverbEnv(e.target.value)} className="bg-transparent text-[8px] font-mono text-[#888] uppercase focus:outline-none text-center cursor-pointer font-bold tracking-wider">
                       <option value="Small Room">Room</option>
                       <option value="Studio">Studio</option>
                       <option value="Warehouse">Warehs</option>
                       <option value="Cathedral">Cathdl</option>
                    </select>
                    <input type="range" min="0" max="1" step="0.01" value={reverbMix} onChange={(e) => setReverbMix(parseFloat(e.target.value))} className="w-full h-1 accent-[#c934ff] pointer-events-none sm:pointer-events-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Instrument Box */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center border-b border-[#222] pb-2">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.8)]" />
                   <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Synthesizer</h2>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className={`text-[9px] uppercase font-bold border px-3 py-1 rounded transition-colors ${isEditing ? 'border-[#c671f0] text-[#fff] bg-[#a120cc]' : 'border-[#333] text-[#888] hover:bg-[#222]'}`}>
                  {isEditing ? 'Done' : 'Tweak'}
                </button>
              </div>

              {isEditing ? (
                <div className="bg-[#161616] p-3 rounded-lg border border-[#3b2347] grid grid-cols-2 gap-3 shadow-inner">
                   <div className="flex flex-col gap-1 col-span-2">
                     <span className="text-[#555] text-[9px] uppercase font-bold tracking-widest">Waveform</span>
                     <select value={activePreset.type} onChange={e => updatePresetField('type', e.target.value)} className="bg-[#1a1a1a] text-[#00d0ff] text-[10px] p-2 border border-[#333] rounded uppercase font-bold focus:outline-none">
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                     </select>
                   </div>
                   <div className="flex flex-col gap-1 cursor-pointer" onClick={() => handleMidiSelect('attack')}>
                     <span className={`text-[9px] uppercase flex justify-between font-bold ${midiLearnTarget === 'attack' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}><span>Att</span><span>{activePreset.attack.toFixed(2)}s</span></span>
                     <input type="range" min="0.001" max="2" step="0.01" value={activePreset.attack} onChange={e => updatePresetField('attack', parseFloat(e.target.value))} className="accent-[#00d0ff] pointer-events-none sm:pointer-events-auto" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[#555] text-[9px] uppercase flex justify-between font-bold"><span>Rel</span><span>{activePreset.release.toFixed(2)}s</span></span>
                     <input type="range" min="0.01" max="3" step="0.01" value={activePreset.release} onChange={e => updatePresetField('release', parseFloat(e.target.value))} className="accent-[#00d0ff]" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[#555] text-[9px] uppercase flex justify-between font-bold"><span>Octave</span></span>
                     <input type="range" min="-2" max="2" step="1" value={activePreset.octaveOffset} onChange={e => updatePresetField('octaveOffset', parseInt(e.target.value))} className="accent-[#00d0ff]" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[#555] text-[9px] uppercase flex justify-between font-bold"><span>Bent</span><span className="text-[#c934ff]">{(pitchBend * 2).toFixed(1)}</span></span>
                     <input type="range" min="-1" max="1" step="0.01" value={pitchBend} onChange={e => setPitchBend(parseFloat(e.target.value))} onDoubleClick={() => setPitchBend(0)} className="accent-[#c934ff]" />
                   </div>
                   <div className="flex justify-between items-center col-span-2 mt-2 gap-2">
                     <button onClick={() => setIsArp(!isArp)} className={`flex-1 text-[10px] font-bold tracking-widest uppercase px-2 py-1.5 rounded transition-colors border ${isArp ? 'bg-[#c934ff] text-white border-[#c934ff] shadow-[0_0_10px_rgba(201,52,255,0.5)]' : 'bg-[#1a1a1a] border-[#333] text-[#888]'}`}>ARP</button>
                     <button onClick={handleSavePreset} className="flex-[2] bg-[#a120cc] hover:bg-[#c934ff] text-white rounded text-[10px] font-bold uppercase py-1.5 transition-colors">Save Custom</button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between bg-[#161616] border border-[#222] p-3 rounded-lg overflow-hidden relative group">
                     {pulse > 0.1 && <div className="absolute inset-0 bg-gradient-to-r from-[#c934ff]/10 to-[#00d0ff]/10 animate-pulse pointer-events-none" />}
                     <span className="text-white text-sm font-bold tracking-widest uppercase truncate max-w-[50%] relative z-10">{activePreset.name}</span>
                     <span className="text-[#00d0ff] text-[9px] font-bold uppercase bg-[#00d0ff]/10 border border-[#00d0ff]/20 px-2 py-1 rounded relative z-10">{activePreset.category} • {activePreset.type}</span>
                   </div>
                   
                   <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                     {['All', 'Lead', 'Bass', 'Pad', 'Pluck', 'FX'].map(cat => (
                        <button key={cat} onClick={() => setPresetCategory(cat)} className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border whitespace-nowrap transition-colors ${presetCategory === cat ? 'bg-[#222] border-[#555] text-white' : 'bg-transparent border-transparent text-[#666] hover:text-[#999]'}`}>
                          {cat}
                        </button>
                     ))}
                   </div>

                   <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                     {presets.filter(p => presetCategory === 'All' || p.category === presetCategory).map(p => (
                        <InstrumentBtn key={p.id} label={p.name} sub={p.category} active={activePreset.id === p.id} onClick={() => setActivePreset(p)} />
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* MAIN COLUMN: PERFORMANCE & SEQUENCER */}
          <div className="lg:col-span-9 flex flex-col gap-4 md:gap-6">
            
            {/* Performance Pads Box */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex-1">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <div className="flex items-center gap-2">
                   <Circle className={`w-3 h-3 text-[#18a058] transition-colors ${activeNotes.size > 0 ? 'fill-current shadow-[0_0_8px_rgba(24,160,88,1)]' : ''}`} />
                   <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Performance Surface</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {DRUM_PADS.map((pad) => {
                  const isActive = activeNotes.has(pad.id);
                  const isBlue = pad.id === 'mod' || pad.id === 'crush';
                  return (
                    <div 
                      key={pad.id}
                      onPointerDown={(e) => { e.preventDefault(); triggerDrum(pad.id); }}
                      className={`
                        relative aspect-square rounded-lg md:rounded-xl cursor-pointer select-none transition-all duration-75
                        flex flex-col items-center justify-center p-2
                        ${isActive 
                          ? isBlue 
                            ? 'border border-[#00d0ff] bg-[#1a2f3a] shadow-[0_0_15px_rgba(0,208,255,0.3)] scale-95' 
                            : 'border border-[#a120cc] bg-[#2a1b32] shadow-[0_0_15px_rgba(161,32,204,0.4)] scale-95'
                          : 'border border-transparent bg-[#161616] hover:bg-[#1c1c1c] hover:border-[#333] scale-100'
                        }
                      `}
                    >
                      {pad.keyBind && <span className="absolute top-2 left-2 text-[8px] md:text-[10px] font-mono font-medium text-[#444]">[{pad.keyBind.toUpperCase()}]</span>}
                      
                      {isBlue && (
                        <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full border-[2px] mb-1.5 transition-colors ${isActive ? 'border-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.8)]' : 'border-[#334450]'}`}>
                          <div className={`w-full h-full rounded-full border-[1.5px] scale-50 ${isActive ? 'border-[#00d0ff]' : 'border-[#334450]'}`} />
                        </div>
                      )}
                      {!isBlue && (pad.id === 'kick' || pad.id === 'snare') && (
                        <div className={`w-2 h-2 rounded-sm mb-1.5 transition-colors ${isActive ? 'bg-[#c934ff] shadow-[0_0_8px_rgba(201,52,255,0.8)]' : 'bg-[#3b2347]'}`} />
                      )}

                      <span className={`text-[8px] md:text-[10px] font-bold tracking-widest uppercase transition-colors ${isActive ? (isBlue ? 'text-[#00d0ff]' : 'text-white') : 'text-[#555]'}`}>{pad.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="relative h-28 md:h-40 flex justify-center w-full isolate bg-[#161616] border border-[#222] rounded-xl overflow-hidden mt-auto">
                <div className="flex select-none w-full relative">
                  {PIANO_KEYS.map((key) => {
                    const isActive = activeNotes.has(key.id);
                    if (key.type === 'white') {
                      return (
                        <div
                          key={key.id}
                          onPointerDown={(e) => { e.preventDefault(); triggerNote(key.id, key.freq); }}
                          onPointerUp={() => releaseNote(key.id)}
                          onPointerLeave={() => releaseNote(key.id)}
                          className={`
                            relative flex-1 h-full border-r border-[#333] last:border-r-0
                            transition-all duration-75 cursor-pointer flex items-end justify-center pb-2 md:pb-4 z-0 origin-top
                            ${isActive ? 'bg-gradient-to-t from-[#c934ff]/30 to-white/90 shadow-[inset_0_-4px_15px_rgba(201,52,255,0.5)] scale-y-95' : 'bg-[#e5e5e5] hover:bg-white scale-y-100'}
                          `}
                        >
                          <span className={`font-mono text-[9px] md:text-[10px] font-bold uppercase transition-colors ${isActive ? 'text-[#811abf]' : 'text-[#999]'}`}>
                            [{key.keyBind}]
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Black keys layer */}
                <div className="absolute top-0 left-0 right-0 h-[60%] flex pointer-events-none">
                   {PIANO_KEYS.map((key, index) => {
                     if (key.type === 'white') {
                       const hasNextBlack = index < PIANO_KEYS.length - 1 && PIANO_KEYS[index + 1].type === 'black';
                       return (
                         <div key={`spacer-${key.id}`} className="flex-1 relative">
                           {hasNextBlack && (
                              <BlackKey 
                                data={PIANO_KEYS[index + 1]} 
                                isActive={activeNotes.has(PIANO_KEYS[index + 1].id)}
                                onTrigger={() => triggerNote(PIANO_KEYS[index+1].id, PIANO_KEYS[index+1].freq)}
                                onRelease={() => releaseNote(PIANO_KEYS[index+1].id)}
                              />
                           )}
                         </div>
                       );
                     }
                     return null;
                   })}
                </div>
              </div>
            </div>

            {/* Pattern Sequencer Box */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 lg:gap-2 border-b border-[#222] pb-4 shrink-0 min-w-max">
                <div className="flex items-center gap-4 lg:gap-3">
                  <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest hidden lg:block">Sequencer</h2>
                  
                  <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded border border-[#2a2a2a]">
                    {['A', 'B', 'C', 'D'].map((bank, idx) => (
                      <button 
                        key={bank}
                        onClick={() => setActiveBank(idx)}
                        className={`w-6 h-6 rounded text-[9px] font-bold transition-colors ${activeBank === idx ? 'bg-[#c671f0] text-white shadow-[0_0_8px_rgba(198,113,240,0.5)]' : 'text-[#666] hover:text-[#fff] hover:bg-[#222]'}`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex items-center gap-2 px-4 py-2 lg:px-3 lg:py-1.5 rounded font-bold text-[10px] tracking-widest uppercase transition-colors ${isPlaying ? 'bg-[#c934ff] text-white shadow-[0_0_15px_rgba(201,52,255,0.6)]' : 'bg-[#222] text-[#888] border border-[#333] hover:bg-[#333]'}`}
                  >
                    {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    {isPlaying ? 'Stop' : 'Play'}
                  </button>
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1.5 rounded">
                    <span className="text-[#555] text-[9px] font-mono uppercase">BPM: {bpm}</span>
                    <input type="range" min="60" max="200" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-20 lg:w-16 accent-[#00d0ff] h-1" />
                    <button onClick={handleTapTempo} className="text-[#00d0ff] text-[9px] font-bold uppercase hover:bg-[#00d0ff]/20 px-1.5 py-0.5 rounded transition-colors ml-1">TAP</button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 border-t xl:border-t-0 xl:border-l border-[#222] pt-3 xl:pt-0 xl:pl-3">
                    <span className="text-[#555] text-[8px] font-mono tracking-widest uppercase mr-2 hidden md:block">Live Looper</span>
                    <button onClick={handleExportSequence} className="flex flex-col items-center justify-center p-2 lg:p-1.5 rounded bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-white transition-colors border border-[#333] mr-2" title="Save Sequence JSON">
                       <Save className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                    </button>
                    <button 
                       onClick={toggleLiveLoopRecord}
                       className={`flex items-center gap-1.5 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-3 py-2 lg:px-2 lg:py-1.5 rounded transition-colors ${isLoopRecording ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-[#1a1a1a] border border-[#333] text-[#888] hover:bg-[#222]'}`}
                    >
                       <Circle className={`w-3.5 h-3.5 lg:w-3 lg:h-3 ${isLoopRecording ? 'fill-current' : ''}`} /> {isLoopRecording ? 'Dubbing' : 'Live Dub'}
                    </button>
                    <button 
                       onClick={() => setIsQuantize(!isQuantize)}
                       className={`flex items-center gap-1 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-2 py-2 lg:px-1.5 lg:py-1.5 rounded transition-colors border ${isQuantize ? 'bg-[#c934ff]/20 text-[#c934ff] border-[#c934ff]/50' : 'bg-[#1a1a1a] border border-[#333] text-[#555] hover:bg-[#222]'}`}
                       title="Quantize to 16th notes"
                    >
                       Quant
                    </button>
                    <button 
                       onClick={() => setIsLooping(!isLooping)}
                       className={`flex items-center gap-1.5 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-3 py-2 lg:px-2 lg:py-1.5 rounded transition-colors ${isLooping ? 'bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/50' : 'bg-[#1a1a1a] border border-[#333] text-[#888] hover:bg-[#222]'}`}
                    >
                       <Repeat className="w-3.5 h-3.5 lg:w-3 lg:h-3" /> Loop
                    </button>
                    <button onClick={clearLoop} className="text-[#555] hover:text-red-400 text-[9px] font-bold uppercase transition-colors px-2">Clear</button>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-max">
                {['kick', 'snare', 'hatCl', 'clap'].map((track, trackIdx) => (
                  <div key={track} className="flex gap-2 lg:gap-4 items-center">
                    <span className="w-10 lg:w-16 text-[8px] lg:text-[10px] font-mono font-bold text-[#666] uppercase text-right tracking-widest">{track}</span>
                    <div className="flex gap-1 lg:gap-2 flex-1">
                      {sequence[track].map((isActive, i) => (
                        <div 
                          key={i}
                          onClick={() => toggleStep(track, i)} 
                          className={`w-8 lg:flex-1 h-8 lg:h-10 rounded-[3px] border cursor-pointer transition-colors
                            ${i % 4 === 0 ? 'ml-1.5 lg:ml-2' : ''}
                            ${isActive 
                              ? (track === 'hatCl' || track === 'clap' ? 'bg-[#00d0ff] border-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.5)]' : 'bg-[#c934ff] border-[#c934ff] shadow-[0_0_8px_rgba(201,52,255,0.5)]')
                              : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#222]'
                            }
                            ${isPlaying && currentStep === i ? 'ring-2 ring-white scale-105' : ''}
                          `}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Global Footer Elements */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 py-4 gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${pulse > 0.1 ? 'bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,1)]' : 'bg-[#18a058] shadow-[0_0_5px_rgba(24,160,88,0.8)]'} transition-colors duration-75`} />
            <span className="text-[#555] text-[8px] font-mono tracking-[0.2em] font-semibold">SYSTEM READY</span>
            <span className="text-[#333] text-[8px] font-mono tracking-[0.2em] hidden sm:inline">AUDIO CONTEXT: ACTIVE</span>
          </div>

          <div className="flex flex-col gap-1 items-end">
             <span className="text-[#444] text-[8px] font-mono tracking-[0.2em] uppercase">Active Key Bindings</span>
             <div className="flex flex-wrap gap-2 justify-end max-w-sm text-[8px] font-mono text-[#666]">
                {drumKeyBinds.slice(0, 4).map((b: any) => (
                  <span key={b.id} className="bg-[#111] border border-[#222] px-1.5 py-0.5 rounded text-[#888]"><strong className="text-[#c934ff] uppercase mr-1">{b.keyBind}</strong> {b.id}</span>
                ))}
                {pianoKeyBinds.slice(0, 7).map((b: any) => (
                  <span key={b.id} className="bg-[#111] border border-[#222] px-1.5 py-0.5 rounded text-[#888]"><strong className="text-[#00d0ff] uppercase mr-1">{b.keyBind}</strong> note</span>
                ))}
                <span className="text-[#444] italic">...and more in settings</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function BlackKey({ data, isActive, onTrigger, onRelease }: { data: any, isActive: boolean, onTrigger: () => void, onRelease: () => void }) {
  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); onTrigger(); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      className={`
        absolute top-0 right-0 translate-x-[50%] w-[60%] h-full rounded-b-md z-10
        pointer-events-auto cursor-pointer transition-all duration-75 flex items-end justify-center pb-2 border-x border-[#111] origin-top
        ${isActive ? 'bg-[#43105e] border-b-2 border-b-[#c934ff] shadow-[0_0_15px_rgba(201,52,255,0.5)] scale-y-95' : 'bg-[#151515] border-b-2 border-b-[#000] shadow-xl scale-y-100'}
      `}
    >
      <span className={`font-mono text-[8px] md:text-[9px] uppercase font-bold ${isActive ? 'text-white' : 'text-[#444]'}`}>
        [{data.keyBind}]
      </span>
    </div>
  );
}

function InstrumentBtn({ label, sub, active, onClick }: { key?: string | number, label: string, sub: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 md:p-3 rounded-lg border cursor-pointer transition-all duration-300
        ${active ? 'border-[#a120cc] bg-[#1d1223] shadow-[0_0_20px_rgba(161,32,204,0.15)]' : 'border-[#333]/30 bg-[#161616] hover:bg-[#1a1a1a] hover:border-[#444]'}
      `}
    >
      <span className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase mb-0.5 whitespace-nowrap ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-[#888]'}`}>{label}</span>
      <span className={`text-[7px] md:text-[8px] font-mono tracking-wider whitespace-nowrap ${active ? 'text-[#00d0ff]' : 'text-[#444]'}`}>{sub}</span>
    </div>
  );
}
