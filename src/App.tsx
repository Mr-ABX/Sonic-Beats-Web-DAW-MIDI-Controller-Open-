import { useEffect, useState, useCallback, useRef } from 'react';
import { audio } from './lib/audioEngine';
import { PIANO_KEYS, DRUM_PADS, CORE_PRESETS, SynthPreset } from './lib/constants';
import { Play, Square, ListMusic, Settings, Circle, Download, Repeat, Save, Undo2, Redo2, Activity, BarChart2 } from 'lucide-react';
import { CommandHistory } from './lib/useCommandHistory';
import MidiWriter from 'midi-writer-js';

import { SettingsModal } from './components/SettingsModal';
import { TopBar } from './components/TopBar';
import { GlobalFooter } from './components/GlobalFooter';
import { MixerPanel } from './components/MixerPanel';
import { InstrumentPanel } from './components/InstrumentPanel';
import { SequencerPanel } from './components/SequencerPanel';
import { PerformanceArea } from './components/PerformanceArea';

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
  const [midiMappings, setMidiMappings] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('vibe_midi_mappings');
    return saved ? JSON.parse(saved) : { 7: 'volume', 12: 'delayMix', 13: 'reverbMix' };
  });

  const midiMappingsRef = useRef(midiMappings);
  useEffect(() => { 
    midiMappingsRef.current = midiMappings; 
    localStorage.setItem('vibe_midi_mappings', JSON.stringify(midiMappings));
  }, [midiMappings]);

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
                  case 'attack': setActivePreset(p => ({ ...p, attack: normVal * 2 })); break;
                  case 'release': setActivePreset(p => ({ ...p, release: normVal * 3 })); break;
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
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-start p-3 md:p-4 selection:bg-[#c934ff]/30 overflow-y-auto relative isolate" data-theme={appTheme}>
      {/* Background ambient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#c934ff]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#00d0ff]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      
      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        pianoKeyBinds={pianoKeyBinds}
        setPianoKeyBinds={setPianoKeyBinds}
        drumKeyBinds={drumKeyBinds}
        setDrumKeyBinds={setDrumKeyBinds}
        eqLow={eqLow}
        setEqLow={setEqLow}
        eqMid={eqMid}
        setEqMid={setEqMid}
        eqHigh={eqHigh}
        setEqHigh={setEqHigh}
        appTheme={appTheme}
        setAppTheme={setAppTheme}
        midiLearnMode={midiLearnMode}
        setMidiLearnMode={setMidiLearnMode}
        midiMappings={midiMappings}
        setMidiMappings={setMidiMappings}
      />

      {/* Main Container with Bento Box layout */}
      <div 
        className="w-full max-w-[1280px] relative transition-transform duration-75 flex flex-col gap-3"
        style={{ transform: `scale(${1 + pulse * 0.003})` }}
      >
        
        <TopBar
          visualizerMode={visualizerMode}
          setVisualizerMode={setVisualizerMode}
          pulse={pulse}
          canvasRef={canvasRef}
          canUndo={historyRef.current.canUndo}
          canRedo={historyRef.current.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          audioDownloadUrl={audioDownloadUrl}
          isRecordingAudio={isRecordingAudio}
          toggleAudioRecord={toggleAudioRecord}
          setShowSettings={setShowSettings}
        />

        {/* BENTO GRID MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* SIDE RAIL: TWEAKS & MIXER */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            <MixerPanel 
              volume={volume} setVolume={setVolume}
              synthVol={synthVol} setSynthVol={setSynthVol}
              bassVol={bassVol} setBassVol={setBassVol}
              drumVol={drumVol} setDrumVol={setDrumVol}
              delayMix={delayMix} setDelayMix={setDelayMix}
              reverbMix={reverbMix} setReverbMix={setReverbMix}
              reverbEnv={reverbEnv} setReverbEnv={setReverbEnv}
              midiLearnMode={midiLearnMode}
              midiLearnTarget={midiLearnTarget}
              handleMidiSelect={handleMidiSelect}
            />

            <InstrumentPanel 
              isEditing={isEditing} setIsEditing={setIsEditing}
              activePreset={activePreset} updatePresetField={updatePresetField}
              pitchBend={pitchBend} setPitchBend={setPitchBend}
              isArp={isArp} setIsArp={setIsArp}
              handleSavePreset={handleSavePreset}
              pulse={pulse}
              presetCategory={presetCategory} setPresetCategory={setPresetCategory}
              presets={presets} setActivePreset={setActivePreset}
              midiLearnTarget={midiLearnTarget} handleMidiSelect={handleMidiSelect}
              InstrumentBtn={InstrumentBtn}
            />
          </div>

          {/* MAIN COLUMN: PERFORMANCE & SEQUENCER */}
          <div className="lg:col-span-9 flex flex-col gap-3">
            
            <PerformanceArea 
              activeNotes={activeNotes} 
              triggerDrum={triggerDrum} 
              triggerNote={triggerNote} 
              releaseNote={releaseNote}
              DRUM_PADS={DRUM_PADS}
              PIANO_KEYS={PIANO_KEYS}
            />

            <SequencerPanel 
              activeBank={activeBank} setActiveBank={setActiveBank}
              isPlaying={isPlaying} setIsPlaying={setIsPlaying}
              bpm={bpm} setBpm={setBpm}
              handleTapTempo={handleTapTempo}
              handleExportSequence={handleExportSequence}
              isLoopRecording={isLoopRecording} toggleLiveLoopRecord={toggleLiveLoopRecord}
              isQuantize={isQuantize} setIsQuantize={setIsQuantize}
              isLooping={isLooping} setIsLooping={setIsLooping}
              clearLoop={clearLoop}
              sequence={sequence} currentStep={currentStep} toggleStep={toggleStep}
            />

          </div>
        </div>

        <GlobalFooter 
          pulse={pulse} 
          drumKeyBinds={drumKeyBinds} 
          pianoKeyBinds={pianoKeyBinds} 
        />

      </div>
    </div>
  );
}

function InstrumentBtn({ label, sub, active, onClick }: { key?: string | number, label: string, sub: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all duration-300
        ${active ? 'border-[#a120cc]/50 bg-[#a120cc]/10 shadow-[0_0_15px_rgba(161,32,204,0.2)]' : 'border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'}
      `}
    >
      <span className={`text-[9px] md:text-[10px] font-bold tracking-wider uppercase mb-0.5 whitespace-nowrap ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-[#888]'}`}>{label}</span>
      <span className={`text-[8px] font-mono tracking-wider whitespace-nowrap ${active ? 'text-[#00d0ff]' : 'text-[#555]'}`}>{sub}</span>
    </div>
  );
}
