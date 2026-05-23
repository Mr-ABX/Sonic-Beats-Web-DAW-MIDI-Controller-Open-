import { Settings, ListMusic, BarChart2, Activity } from 'lucide-react';
import { SettingsKeyMapper } from './SettingsKeyMapper';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  pianoKeyBinds: any[];
  setPianoKeyBinds: (val: any[]) => void;
  drumKeyBinds: any[];
  setDrumKeyBinds: (val: any[]) => void;
  eqLow: number;
  setEqLow: (val: number) => void;
  eqMid: number;
  setEqMid: (val: number) => void;
  eqHigh: number;
  setEqHigh: (val: number) => void;
  appTheme: string;
  setAppTheme: (val: string) => void;
  midiLearnMode: 'waiting' | 'listening' | null;
  setMidiLearnMode: (val: 'waiting' | 'listening' | null) => void;
  midiMappings: Record<number, string>;
  setMidiMappings: (val: Record<number, string>) => void;
}

export function SettingsModal({
  showSettings,
  setShowSettings,
  pianoKeyBinds,
  setPianoKeyBinds,
  drumKeyBinds,
  setDrumKeyBinds,
  eqLow,
  setEqLow,
  eqMid,
  setEqMid,
  eqHigh,
  setEqHigh,
  appTheme,
  setAppTheme,
  midiLearnMode,
  setMidiLearnMode,
  midiMappings,
  setMidiMappings
}: SettingsModalProps) {
  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><Settings className="w-5 h-5 text-[#00d0ff]" /> System Settings</h2>
          <button onClick={() => setShowSettings(false)} className="text-[#888] hover:text-white font-bold text-xl leading-none">&times;</button>
        </div>
        <div className="flex flex-col gap-4 py-2 flex-1 overflow-auto max-h-[70vh] custom-scrollbar pr-2">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
             <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><ListMusic className="w-3 h-3 text-[#18a058]"/> Keyboard Mapping Config</h3>
             <SettingsKeyMapper 
                pianoBinds={pianoKeyBinds} 
                drumBinds={drumKeyBinds}
                onPianoChange={setPianoKeyBinds}
                onDrumChange={setDrumKeyBinds}
             />
          </div>
          
          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
             <h3 className="text-white text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><BarChart2 className="w-3 h-3 text-[#c934ff]"/> Master EQ</h3>
             <div className="grid grid-cols-3 gap-3 px-2">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">Low</span>
                  <input type="range" min="-12" max="12" step="0.1" value={eqLow} onChange={e => setEqLow(parseFloat(e.target.value))} className="w-full accent-[#c934ff]" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">Mid</span>
                  <input type="range" min="-12" max="12" step="0.1" value={eqMid} onChange={e => setEqMid(parseFloat(e.target.value))} className="w-full accent-[#c934ff]" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[#888] text-[8px] font-mono uppercase tracking-widest">High</span>
                  <input type="range" min="-12" max="12" step="0.1" value={eqHigh} onChange={e => setEqHigh(parseFloat(e.target.value))} className="w-full accent-[#c934ff]" />
                </div>
             </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
             <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2">Interface Theme</h3>
             <select value={appTheme} onChange={e => setAppTheme(e.target.value)} className="bg-white/5 text-[#00d0ff] text-[10px] p-2 border border-white/10 rounded-md uppercase font-bold focus:outline-none w-full appearance-none">
                <option value="neon-cyber" className="bg-[#111]">Neon Cyber</option>
                <option value="classic-gold" className="bg-[#111]">Classic Gold</option>
                <option value="industrial-green" className="bg-[#111]">Industrial Green</option>
             </select>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
             <h3 className="text-[#fff] text-[10px] font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3 text-[#00d0ff]"/> MIDI Learn Mode</h3>
             <p className="text-[#888] text-[9px] mb-3 leading-relaxed">Click 'Learn', then select a UI parameter like Volume or Delay, and move a physical knob on your MIDI controller to bind them.</p>
             <div className="flex items-center justify-between gap-3">
               <button 
                 onClick={() => setMidiLearnMode(midiLearnMode ? null : 'waiting')}
                 className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors border flex-1 ${midiLearnMode ? 'bg-[#c934ff]/10 text-[#c934ff] border-[#c934ff]/50 animate-pulse window-shadow' : 'bg-white/5 text-[#888] border-white/10 hover:text-white hover:bg-white/10'}`}
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
  );
}
