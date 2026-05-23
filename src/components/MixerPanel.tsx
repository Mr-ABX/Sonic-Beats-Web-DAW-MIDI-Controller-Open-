import React from 'react';
import { Settings } from 'lucide-react';

interface MixerPanelProps {
  volume: number;
  setVolume: (val: number) => void;
  synthVol: number;
  setSynthVol: (val: number) => void;
  bassVol: number;
  setBassVol: (val: number) => void;
  drumVol: number;
  setDrumVol: (val: number) => void;
  delayMix: number;
  setDelayMix: (val: number) => void;
  reverbMix: number;
  setReverbMix: (val: number) => void;
  reverbEnv: string;
  setReverbEnv: (val: string) => void;
  midiLearnMode: 'waiting' | 'listening' | null;
  midiLearnTarget: string | null;
  handleMidiSelect: (target: string) => void;
}

export function MixerPanel({
  volume, setVolume,
  synthVol, setSynthVol,
  bassVol, setBassVol,
  drumVol, setDrumVol,
  delayMix, setDelayMix,
  reverbMix, setReverbMix,
  reverbEnv, setReverbEnv,
  midiLearnMode,
  midiLearnTarget,
  handleMidiSelect
}: MixerPanelProps) {
  return (
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
  );
}
