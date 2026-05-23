import React from 'react';
import { SynthPreset } from '../lib/constants';

interface InstrumentPanelProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  activePreset: SynthPreset;
  updatePresetField: (field: keyof SynthPreset, val: any) => void;
  pitchBend: number;
  setPitchBend: (val: number) => void;
  isArp: boolean;
  setIsArp: (val: boolean) => void;
  handleSavePreset: () => void;
  pulse: number;
  presetCategory: string;
  setPresetCategory: (val: string) => void;
  presets: SynthPreset[];
  setActivePreset: (val: SynthPreset) => void;
  midiLearnTarget: string | null;
  handleMidiSelect: (target: string) => void;
  InstrumentBtn: React.FC<{label: string, sub: string, active: boolean, onClick: () => void}>;
}

export function InstrumentPanel({
  isEditing, setIsEditing,
  activePreset, updatePresetField,
  pitchBend, setPitchBend,
  isArp, setIsArp,
  handleSavePreset,
  pulse,
  presetCategory, setPresetCategory,
  presets, setActivePreset,
  midiLearnTarget, handleMidiSelect,
  InstrumentBtn
}: InstrumentPanelProps) {
  return (
    <div className="bg-[#0c0c0e]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,0.8)]" />
           <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Synthesizer</h2>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className={`text-[9px] uppercase font-bold border px-3 py-1 rounded transition-colors ${isEditing ? 'border-[#c671f0] text-[#fff] bg-[#a120cc]' : 'border-[#333] text-[#888] hover:bg-[#222]'}`}>
          {isEditing ? 'Done' : 'Tweak'}
        </button>
      </div>

      {isEditing ? (
        <div className="bg-black/20 p-3 rounded-lg border border-white/5 grid grid-cols-2 gap-3 mt-1">
           <div className="flex flex-col gap-1 col-span-2">
             <span className="text-[#555] text-[9px] uppercase font-bold tracking-widest">Waveform</span>
             <select value={activePreset.type} onChange={e => updatePresetField('type', e.target.value)} className="bg-white/5 appearance-none text-[#00d0ff] text-[10px] p-2 border border-white/10 rounded-md uppercase font-bold focus:outline-none">
                <option value="sine" className="bg-[#111]">Sine</option>
                <option value="square" className="bg-[#111]">Square</option>
                <option value="sawtooth" className="bg-[#111]">Sawtooth</option>
                <option value="triangle" className="bg-[#111]">Triangle</option>
             </select>
           </div>
           <div className="flex flex-col gap-1 cursor-pointer" onClick={() => handleMidiSelect('attack')}>
             <span className={`text-[9px] uppercase flex justify-between font-bold ${midiLearnTarget === 'attack' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}><span>Att</span><span>{activePreset.attack.toFixed(2)}s</span></span>
             <input type="range" min="0.001" max="2" step="0.01" value={activePreset.attack} onChange={e => updatePresetField('attack', parseFloat(e.target.value))} className="accent-[#00d0ff] pointer-events-none sm:pointer-events-auto" />
           </div>
           <div className="flex flex-col gap-1 cursor-pointer" onClick={() => handleMidiSelect('release')}>
             <span className={`text-[9px] uppercase flex justify-between font-bold ${midiLearnTarget === 'release' ? 'text-[#00d0ff] animate-pulse' : 'text-[#555]'}`}><span>Rel</span><span>{activePreset.release.toFixed(2)}s</span></span>
             <input type="range" min="0.01" max="3" step="0.01" value={activePreset.release} onChange={e => updatePresetField('release', parseFloat(e.target.value))} className="accent-[#00d0ff] pointer-events-none sm:pointer-events-auto" />
           </div>
           <div className="flex flex-col gap-1">
             <span className="text-[#555] text-[9px] uppercase flex justify-between font-bold"><span>Octave</span></span>
             <input type="range" min="-2" max="2" step="1" value={activePreset.octaveOffset} onChange={e => updatePresetField('octaveOffset', parseInt(e.target.value))} className="accent-[#00d0ff]" />
           </div>
           <div className="flex flex-col gap-1">
             <span className="text-[#555] text-[9px] uppercase flex justify-between font-bold"><span>Bent</span><span className="text-[#c934ff]">{(pitchBend * 2).toFixed(1)}</span></span>
             <input type="range" min="-1" max="1" step="0.01" value={pitchBend} onChange={e => setPitchBend(parseFloat(e.target.value))} onDoubleClick={() => setPitchBend(0)} className="accent-[#c934ff]" />
           </div>
           <div className="flex justify-between items-center col-span-2 mt-1 gap-2">
             <button onClick={() => setIsArp(!isArp)} className={`flex-1 text-[10px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-md transition-colors border ${isArp ? 'bg-[#c934ff] text-white border-[#c934ff] shadow-[0_0_10px_rgba(201,52,255,0.5)]' : 'bg-white/5 border-white/10 text-[#888] hover:text-white'}`}>ARP</button>
             <button onClick={handleSavePreset} className="flex-[2] bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-md text-[10px] font-bold uppercase py-1.5 transition-colors">Save Custom</button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-1">
           <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 px-3 rounded-lg overflow-hidden relative group">
             {pulse > 0.1 && <div className="absolute inset-0 bg-gradient-to-r from-[#c934ff]/10 to-[#00d0ff]/10 animate-pulse pointer-events-none" />}
             <span className="text-white text-sm font-bold tracking-widest uppercase truncate max-w-[50%] relative z-10">{activePreset.name}</span>
             <span className="text-[#00d0ff] text-[9px] font-bold uppercase bg-[#00d0ff]/10 border border-[#00d0ff]/20 px-2 py-1 rounded relative z-10">{activePreset.category} • {activePreset.type}</span>
           </div>
           
           <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
             {['All', 'Lead', 'Bass', 'Pad', 'Pluck', 'Guitar', 'Keys', 'FX'].map(cat => (
                <button key={cat} onClick={() => setPresetCategory(cat)} className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${presetCategory === cat ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-[#666] hover:text-[#bbb]'}`}>
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
  );
}
