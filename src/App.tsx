import { useEffect, useState, useCallback, useRef } from 'react';
import { audio } from './lib/audioEngine';
import { PIANO_KEYS, DRUM_PADS, CORE_PRESETS, SynthPreset } from './lib/constants';
import { Play, Square, ListMusic, Settings, Circle, Download, Repeat, Save } from 'lucide-react';

import { SettingsKeyMapper } from './components/SettingsKeyMapper';

export default function App() {
  const [presets, setPresets] = useState<SynthPreset[]>(() => {
    const saved = localStorage.getItem('vibe_midi_presets');
    return saved ? JSON.parse(saved) : CORE_PRESETS;
  });
  const [activePreset, setActivePreset] = useState<SynthPreset>(presets[0]);
  const activePresetRef = useRef(activePreset);
  useEffect(() => { activePresetRef.current = activePreset; }, [activePreset]);

  // Sequencer State
  const [showSeq, setShowSeq] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  const [sequence, setSequence] = useState<Record<string, boolean[]>>({
    kick:  [true, false, false, false,  true, false, false, false,  true, false, false, false,  true, false, false, false],
    snare: [false, false, false, false,  true, false, false, false,  false, false, false, false,  true, false, false, false],
    hatCl: [true, false, true, false,  true, false, true, false,  true, false, true, false,  true, false, true, false],
    clap:  [false, false, false, false,  false, false, false, false,  false, false, false, false,  false, false, false, false],
  });
  const sequenceRef = useRef(sequence);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);

  const [volume, setVolume] = useState(0.8);
  const [synthVol, setSynthVol] = useState(0.8);
  const [bassVol, setBassVol] = useState(0.8);
  const [drumVol, setDrumVol] = useState(0.8);
  const [pitchBend, setPitchBend] = useState(0);
  
  const [delayMix, setDelayMix] = useState(0);
  const [reverbMix, setReverbMix] = useState(0);
  const [reverbEnv, setReverbEnv] = useState('Studio');
  
  const [isQuantize, setIsQuantize] = useState(false);
  const [isArp, setIsArp] = useState(false);
  const [appTheme, setAppTheme] = useState('neon-cyber');
  
  const [pulse, setPulse] = useState(0);
  const pulseRef = useRef(0);

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

  // Visualizer loop
  useEffect(() => {
    let req: number;
    const animate = () => {
      const level = audio.getVisualizerLevel();
      pulseRef.current += (level - pulseRef.current) * 0.3; // smooth dampening
      setPulse(pulseRef.current);
      req = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(req);
  }, []);

  // Sequencer loop
  useEffect(() => {
    if (!isPlaying) return;
    let step = 0;
    setCurrentStep(0);
    const intervalTime = (60 / bpm) / 4 * 1000;
    
    // Note: setInterval drift is acceptable for this standalone visualizer toy
    const intervalId = setInterval(() => {
      ['kick', 'snare', 'hatCl', 'clap'].forEach(drum => {
        if (sequenceRef.current[drum][step]) {
           audio.playDrum(drum);
        }
      });
      setCurrentStep(step);
      step = (step + 1) % 16;
    }, intervalTime);
    
    return () => clearInterval(intervalId);
  }, [isPlaying, bpm]);

  const toggleStep = (drum: string, index: number) => {
    setSequence(prev => {
      const next = { ...prev };
      next[drum] = [...next[drum]];
      next[drum][index] = !next[drum][index];
      return next;
    });
  };

  const handleExportSequence = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sequenceRef.current, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "vibe_sequence.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
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
    setActivePreset(p => ({ ...p, [field]: val }));
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
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-[#c934ff]/30 overflow-y-auto" data-theme={appTheme}>
      
      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#222] pb-4">
              <h2 className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><Settings className="w-5 h-5 text-[#00d0ff]" /> System Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#888] hover:text-white font-bold text-xl leading-none">&times;</button>
            </div>
            <div className="flex flex-col gap-4 py-2 flex-1 overflow-auto">
              <SettingsKeyMapper 
                 pianoBinds={pianoKeyBinds} 
                 drumBinds={drumKeyBinds}
                 onPianoChange={setPianoKeyBinds}
                 onDrumChange={setDrumKeyBinds}
              />
              
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                 <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2">Interface Theme</h3>
                 <select value={appTheme} onChange={e => setAppTheme(e.target.value)} className="bg-[#111] text-[#00d0ff] text-[10px] p-2 border border-[#333] rounded uppercase font-bold focus:outline-none w-full">
                    <option value="neon-cyber">Neon Cyber</option>
                    <option value="classic-gold">Classic Gold</option>
                    <option value="industrial-green">Industrial Green</option>
                 </select>
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

      {/* Main Container with dynamic visualizer glow */}
      <div 
        className="w-full max-w-4xl bg-[#111111] rounded-2xl p-4 md:p-6 flex flex-col gap-4 md:gap-6 relative transition-transform duration-75"
        style={{ 
          boxShadow: `0 0 ${20 + pulse * 100}px rgba(201, 52, 255, ${0.1 + pulse * 0.5})`,
          transform: `scale(${1 + pulse * 0.015})`
        }}
      >
        
        {/* Top Header */}
        <div className="flex flex-col gap-6 md:gap-0 md:flex-row justify-between items-start md:items-center border-b border-[#222] pb-4 md:pb-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded shrink-0 bg-[#a120cc] flex items-center justify-center text-white font-bold text-sm tracking-widest shadow-[0_0_15px_rgba(161,32,204,0.5)]">
              V
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-sm font-bold tracking-[0.15em] uppercase">Sonic Beats</h1>
                <span className="text-[10px] bg-[#2a1b32] text-[#c671f0] px-1.5 py-0.5 rounded font-mono tracking-wider font-semibold border border-[#3b2347]">STANDALONE V1.1</span>
              </div>
              <p className="text-[#555] text-[9px] font-mono tracking-widest uppercase">Digital Audio Engine / No External DAW Required</p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
             <div className="flex items-center gap-2 mr-2">
               {audioDownloadUrl && (
                 <a href={audioDownloadUrl} download="vibe-midi-mix.webm" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/50 hover:bg-[#00d0ff]/30 shadow-[0_0_10px_rgba(0,208,255,0.2)]">
                   <Download className="w-3 h-3" /> Get Mix
                 </a>
               )}
               <button 
                 onClick={toggleAudioRecord}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${isRecordingAudio ? 'bg-red-500 text-white border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-[#1a1a1a] text-[#888] border border-[#333] hover:bg-[#222]'}`}
               >
                  <Circle className={`w-3 h-3 ${isRecordingAudio ? 'fill-current' : ''}`} /> {isRecordingAudio ? 'Recording...' : 'Rec Master'}
               </button>
               <button onClick={() => setShowSettings(true)} className="p-1.5 rounded bg-[#1a1a1a] text-[#888] border border-[#333] hover:bg-[#222] hover:text-white transition-colors">
                 <Settings className="w-4 h-4" />
               </button>
             </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[#555] text-[9px] font-mono tracking-widest uppercase">Master Volume</span>
              <div className="w-24 md:w-32 h-1.5 bg-[#222] rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#7a18cc] via-[#c934ff] to-[#00d0ff]" style={{ width: `${volume * 100}%` }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[#555] text-[9px] font-mono tracking-widest uppercase text-right">Mixer Groups<br/>Syn / Bas / Drm</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-1">
                <span className="text-[#555] text-[7px] font-mono uppercase mb-0.5">SYN</span>
                <input type="range" min="0" max="1" step="0.01" value={synthVol} onChange={(e) => setSynthVol(parseFloat(e.target.value))} className="w-8 h-1 accent-[#00d0ff]" />
              </div>
              <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-1">
                <span className="text-[#555] text-[7px] font-mono uppercase mb-0.5">BAS</span>
                <input type="range" min="0" max="1" step="0.01" value={bassVol} onChange={(e) => setBassVol(parseFloat(e.target.value))} className="w-8 h-1 accent-[#c934ff]" />
              </div>
              <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-1">
                <span className="text-[#555] text-[7px] font-mono uppercase mb-0.5">DRM</span>
                <input type="range" min="0" max="1" step="0.01" value={drumVol} onChange={(e) => setDrumVol(parseFloat(e.target.value))} className="w-8 h-1 accent-[#fff]" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 ml-2">
              <span className="text-[#555] text-[9px] font-mono tracking-widest uppercase text-right">FX MIX<br/>Delay / Reverb</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1">
                <span className="text-[#555] text-[8px] font-mono uppercase mb-0.5">DLY</span>
                <input type="range" min="0" max="1" step="0.01" value={delayMix} onChange={(e) => setDelayMix(parseFloat(e.target.value))} className="w-10 h-1 accent-[#00d0ff]" />
              </div>
              <div className="flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1">
                <select value={reverbEnv} onChange={e => setReverbEnv(e.target.value)} className="bg-transparent text-[8px] font-mono text-[#555] uppercase focus:outline-none text-center cursor-pointer mb-0.5">
                   <option value="Small Room">Room</option>
                   <option value="Studio">Studio</option>
                   <option value="Warehouse">Warehs</option>
                   <option value="Cathedral">Cathdl</option>
                </select>
                <input type="range" min="0" max="1" step="0.01" value={reverbMix} onChange={(e) => setReverbMix(parseFloat(e.target.value))} className="w-10 h-1 accent-[#c934ff]" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Preset Info & Tweak Toggle */}
        <div className="flex justify-between items-center bg-[#161616] border border-[#333] px-3 py-2 rounded-lg">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.8)]" />
             <span className="text-white text-xs font-bold tracking-widest uppercase">{activePreset.name}</span>
             <span className="text-[#888] text-[10px] font-mono uppercase bg-[#222] px-2 py-0.5 rounded">{activePreset.category} • {activePreset.type}</span>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => setShowSeq(!showSeq)} className={`flex items-center gap-1 text-[9px] md:text-[10px] uppercase font-bold border px-3 py-1 rounded transition-colors ${showSeq ? 'border-[#00d0ff] text-[#00d0ff] bg-[#00d0ff]/10' : 'border-[#333] text-[#888] bg-[#111] hover:bg-[#222]'}`}>
               <ListMusic className="w-3 h-3" /> Sequencer
             </button>
             <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] md:text-[10px] uppercase font-bold border border-[#3b2347] text-[#c671f0] px-3 py-1 rounded bg-[#1d1223] hover:bg-[#2a1b32] transition-colors">
               {isEditing ? 'Close Edits' : 'Tweak Preset'}
             </button>
           </div>
        </div>

        {/* Tweak Panel */}
        {isEditing && (
          <div className="bg-[#111] p-4 rounded-lg border border-[#3b2347] grid grid-cols-2 md:grid-cols-6 gap-4 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-[#555] text-[9px] uppercase">Waveform</span>
              <select 
                value={activePreset.type} 
                onChange={e => updatePresetField('type', e.target.value)}
                className="bg-[#1a1a1a] text-[#00d0ff] text-[10px] p-2 border border-[#333] rounded uppercase font-bold focus:outline-none"
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#555] text-[9px] uppercase">Attack ({activePreset.attack.toFixed(2)}s)</span>
              <input type="range" min="0.001" max="2" step="0.01" value={activePreset.attack} onChange={e => updatePresetField('attack', parseFloat(e.target.value))} className="accent-[#00d0ff]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#555] text-[9px] uppercase">Release ({activePreset.release.toFixed(2)}s)</span>
              <input type="range" min="0.01" max="3" step="0.01" value={activePreset.release} onChange={e => updatePresetField('release', parseFloat(e.target.value))} className="accent-[#00d0ff]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#555] text-[9px] uppercase">Octave ({activePreset.octaveOffset > 0 ? '+' : ''}{activePreset.octaveOffset})</span>
              <input type="range" min="-2" max="2" step="1" value={activePreset.octaveOffset} onChange={e => updatePresetField('octaveOffset', parseInt(e.target.value))} className="accent-[#00d0ff]" />
            </div>
            
            <div className="flex flex-col justify-center items-center gap-1 border-l border-[#333] pl-2">
              <button 
                onClick={() => setIsArp(!isArp)} 
                className={`w-full text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded transition-colors border ${isArp ? 'bg-[#c934ff] text-white border-[#c934ff] shadow-[0_0_10px_rgba(201,52,255,0.5)]' : 'border-[#333] text-[#888] hover:text-[#fff]'}`}>
                ARP
              </button>
            </div>
            
            <div className="flex flex-col gap-1 border-l border-[#333] pl-2">
              <span className="text-[#555] text-[9px] uppercase flex justify-between">
                <span>Bent</span>
                <span className="text-[#c934ff]">{(pitchBend * 2).toFixed(1)}</span>
              </span>
              <input type="range" min="-1" max="1" step="0.01" value={pitchBend} onChange={e => setPitchBend(parseFloat(e.target.value))} onDoubleClick={() => setPitchBend(0)} className="accent-[#c934ff]" />
            </div>

            <button onClick={handleSavePreset} className="bg-[#a120cc] hover:bg-[#c934ff] text-white rounded text-[10px] font-bold uppercase col-span-2 md:col-span-6 py-2 transition-colors mt-2">
              Save as New Custom Preset
            </button>
          </div>
        )}

        {/* Presets Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 select-none">
           {presets.map(p => (
             <InstrumentBtn key={p.id} label={p.name} sub={p.category} active={activePreset.id === p.id} onClick={() => setActivePreset(p)} />
           ))}
        </div>

        {/* Sequencer Overlay / View */}
        {showSeq && (
          <div className="bg-[#151515] p-4 rounded-xl border border-[#333] flex flex-col gap-4 shadow-inner">
            <div className="flex justify-between items-center bg-[#111] p-2 rounded border border-[#222]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-[10px] tracking-widest uppercase transition-colors ${isPlaying ? 'bg-[#c934ff] text-white shadow-[0_0_15px_rgba(201,52,255,0.6)]' : 'bg-[#222] text-[#888] border border-[#333] hover:bg-[#333]'}`}
                >
                  {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  {isPlaying ? 'Stop Seq' : 'Play Seq'}
                </button>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between w-24">
                    <span className="text-[#555] text-[8px] font-mono uppercase">Tempo: {bpm}</span>
                    <button onClick={handleTapTempo} className="text-[#00d0ff] text-[8px] font-mono uppercase hover:text-white transition-colors bg-[#00d0ff]/10 px-1 rounded">TAP</button>
                  </div>
                  <input type="range" min="60" max="200" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-24 accent-[#00d0ff] h-1" />
                </div>
              </div>
              
              {/* Dynamic Live Looper Control */}
              <div className="flex items-center gap-2 border-l border-[#333] pl-3">
                 <button onClick={handleExportSequence} className="flex flex-col items-center justify-center p-1.5 rounded bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-white transition-colors border border-[#333] mr-2" title="Save Sequence JSON">
                    <Save className="w-3 h-3" />
                 </button>
                 <button 
                    onClick={toggleLiveLoopRecord}
                    className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${isLoopRecording ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-[#1a1a1a] border border-[#333] text-[#888] hover:bg-[#222]'}`}
                 >
                    <Circle className={`w-3 h-3 ${isLoopRecording ? 'fill-current' : ''}`} /> {isLoopRecording ? 'Dubbing' : 'Live Dub'}
                 </button>
                 <button 
                    onClick={() => setIsQuantize(!isQuantize)}
                    className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 rounded transition-colors border ${isQuantize ? 'bg-[#c934ff]/20 text-[#c934ff] border-[#c934ff]/50' : 'bg-[#1a1a1a] border border-[#333] text-[#555] hover:bg-[#222]'}`}
                    title="Quantize to 16th notes"
                 >
                    Quant
                 </button>
                 <button 
                    onClick={() => setIsLooping(!isLooping)}
                    className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${isLooping ? 'bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/50' : 'bg-[#1a1a1a] border border-[#333] text-[#888] hover:bg-[#222]'}`}
                 >
                    <Repeat className="w-3 h-3" /> Auto-Loop
                 </button>
                 <button onClick={clearLoop} className="text-[#555] hover:text-red-400 text-[9px] font-bold uppercase transition-colors px-2">Clear</button>
              </div>
            </div>

            <div className="flex flex-col gap-1 md:gap-2">
              {['kick', 'snare', 'hatCl', 'clap'].map((track, trackIdx) => (
                <div key={track} className="flex gap-2 items-center">
                  <span className="w-10 text-[8px] md:text-[9px] font-mono font-bold text-[#666] uppercase text-right tracking-widest">{track}</span>
                  <div className="flex gap-1 flex-1">
                    {sequence[track].map((isActive, i) => (
                      <div 
                        key={i}
                        onClick={() => toggleStep(track, i)} 
                        className={`flex-1 aspect-[2/1] md:aspect-square rounded-[3px] border cursor-pointer transition-colors
                          ${i % 4 === 0 ? 'ml-1 md:ml-2' : ''}
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
        )}

        {/* Drum Pads Grid */}
        <div className="grid grid-cols-5 gap-2 mt-1">
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
                      ? 'border border-[#00d0ff] bg-[#1a2f3a] shadow-[0_0_15px_rgba(0,208,255,0.3)]' 
                      : 'border border-[#a120cc] bg-[#2a1b32] shadow-[0_0_15px_rgba(161,32,204,0.4)]'
                    : 'border border-transparent bg-[#161616] hover:bg-[#1c1c1c] hover:border-[#333]'
                  }
                `}
              >
                {pad.keyBind && <span className="absolute top-2 left-2 text-[8px] md:text-[10px] font-mono font-medium text-[#444]">[{pad.keyBind.toUpperCase()}]</span>}
                
                {isBlue && (
                  <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full border-[2px] ${isActive ? 'border-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.8)]' : 'border-[#334450]'} mb-1`}>
                    <div className={`w-full h-full rounded-full border-[1.5px] scale-50 ${isActive ? 'border-[#00d0ff]' : 'border-[#334450]'}`} />
                  </div>
                )}
                {!isBlue && (pad.id === 'kick' || pad.id === 'snare') && (
                  <div className={`w-2 h-2 rounded-sm ${isActive ? 'bg-[#c934ff] shadow-[0_0_8px_rgba(201,52,255,0.8)]' : 'bg-[#3b2347]'} mb-1.5`} />
                )}

                <span className={`text-[8px] md:text-[10px] font-bold tracking-widest uppercase ${isActive ? (isBlue ? 'text-[#00d0ff]' : 'text-white') : 'text-[#555]'}`}>{pad.label}</span>
              </div>
            );
          })}
        </div>

        {/* Piano Layout */}
        <div className="relative h-24 md:h-32 flex justify-center w-full isolate bg-[#161616] border border-[#222] rounded-xl overflow-hidden mt-1">
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
                      transition-colors duration-75 cursor-pointer flex items-end justify-center pb-2 md:pb-4 z-0
                      ${isActive ? 'bg-gradient-to-t from-[#c934ff]/30 to-white/90 shadow-[inset_0_-4px_15px_rgba(201,52,255,0.5)]' : 'bg-[#e5e5e5] hover:bg-white'}
                    `}
                  >
                    <span className={`font-mono text-[9px] font-bold uppercase transition-colors ${isActive ? 'text-[#811abf]' : 'text-[#999]'}`}>
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

        {/* Footer */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${pulse > 0.1 ? 'bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,1)]' : 'bg-[#18a058] shadow-[0_0_5px_rgba(24,160,88,0.8)]'} transition-colors duration-75`} />
            <span className="text-[#555] text-[8px] font-mono tracking-[0.2em] font-semibold">SYSTEM READY</span>
            <span className="text-[#333] text-[8px] font-mono tracking-[0.2em]">AUDIO CONTEXT: ACTIVE</span>
          </div>
          <span className="text-[#333] text-[8px] font-mono tracking-[0.2em] uppercase">Mapping: QWERTY_DEFAULT_SYNTH_V1</span>
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
        pointer-events-auto cursor-pointer transition-colors duration-75 flex items-end justify-center pb-2 border-x border-[#111]
        ${isActive ? 'bg-[#43105e] border-b-2 border-b-[#c934ff] shadow-[0_0_15px_rgba(201,52,255,0.5)]' : 'bg-[#151515] border-b-2 border-b-[#000] shadow-xl'}
      `}
    >
      <span className={`font-mono text-[8px] uppercase ${isActive ? 'text-white' : 'text-[#444]'}`}>
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
        ${active ? 'border-[#a120cc] bg-[#1d1223] shadow-[0_0_20px_rgba(161,32,204,0.15)]' : 'border-[#333/10] bg-[#161616] hover:bg-[#1c1c1c] hover:border-[#333]'}
      `}
    >
      <span className={`text-[9px] md:text-xs font-bold tracking-widest uppercase mb-0.5 whitespace-nowrap ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-[#666]'}`}>{label}</span>
      <span className={`text-[7px] md:text-[8px] font-mono tracking-wider whitespace-nowrap ${active ? 'text-[#00d0ff]' : 'text-[#444]'}`}>{sub}</span>
    </div>
  );
}
