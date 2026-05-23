import React from 'react';
import { Play, Square, Circle, Save, Repeat } from 'lucide-react';

interface SequencerPanelProps {
  activeBank: number;
  setActiveBank: (val: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  bpm: number;
  setBpm: (val: number) => void;
  handleTapTempo: () => void;
  handleExportSequence: () => void;
  isLoopRecording: boolean;
  toggleLiveLoopRecord: () => void;
  isQuantize: boolean;
  setIsQuantize: (val: boolean) => void;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  clearLoop: () => void;
  sequence: any;
  currentStep: number;
  toggleStep: (track: string, step: number) => void;
  drumKit: string;
  setDrumKit: (val: string) => void;
}

export function SequencerPanel({
  activeBank, setActiveBank,
  isPlaying, setIsPlaying,
  bpm, setBpm,
  handleTapTempo,
  handleExportSequence,
  isLoopRecording, toggleLiveLoopRecord,
  isQuantize, setIsQuantize,
  isLooping, setIsLooping,
  clearLoop,
  sequence, currentStep, toggleStep,
  drumKit, setDrumKit
}: SequencerPanelProps) {
  return (
    <div className="bg-[#0c0c0e]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-x-auto custom-scrollbar">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 lg:gap-2 border-b border-white/5 pb-3 shrink-0 min-w-max">
        <div className="flex items-center gap-4 lg:gap-3">
          <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest hidden lg:block">Sequencer</h2>
          
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
            {['A', 'B', 'C', 'D'].map((bank, idx) => (
              <button 
                key={bank}
                onClick={() => setActiveBank(idx)}
                className={`w-6 h-6 rounded-md text-[9px] font-bold transition-colors ${activeBank === idx ? 'bg-white/10 text-white' : 'text-[#666] hover:text-[#fff] hover:bg-white/5'}`}
              >
                {bank}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 lg:px-3 lg:py-1.5 rounded-md font-bold text-[10px] tracking-widest uppercase transition-colors ${isPlaying ? 'bg-[#c934ff] text-white shadow-[0_0_15px_rgba(201,52,255,0.6)]' : 'bg-black/20 text-[#888] border border-white/5 hover:text-white'}`}
          >
            {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 px-2 py-1.5 rounded-md">
            <span className="text-[#555] text-[9px] font-mono uppercase">BPM: {bpm}</span>
            <input type="range" min="60" max="200" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-20 lg:w-16 accent-[#00d0ff]" />
            <button onClick={handleTapTempo} className="text-[#00d0ff] text-[9px] font-bold uppercase hover:bg-[#00d0ff]/10 px-1.5 py-0.5 rounded transition-colors ml-1">TAP</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-t xl:border-t-0 xl:border-l border-white/5 pt-3 xl:pt-0 xl:pl-3">
            <select
               value={drumKit}
               onChange={(e) => setDrumKit(e.target.value)}
               className="bg-black/20 border border-white/5 text-[#888] hover:text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 rounded outline-none w-20 appearance-none mr-2 transition-colors cursor-pointer"
            >
               <option value="808">808 Kit</option>
               <option value="acoustic">Acoustic</option>
               <option value="electro">Electro</option>
            </select>
            <span className="text-[#555] text-[8px] font-mono tracking-widest uppercase mr-2 hidden md:block">Live Looper</span>
            <button onClick={handleExportSequence} className="flex flex-col items-center justify-center p-2 lg:p-1.5 rounded-md bg-black/20 hover:bg-white/5 text-[#888] hover:text-white transition-colors border border-white/5 mr-2" title="Save Sequence JSON">
               <Save className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
            </button>
            <button 
               onClick={toggleLiveLoopRecord}
               className={`flex items-center gap-1.5 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-3 py-2 lg:px-2 lg:py-1.5 rounded-md transition-colors ${isLoopRecording ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-black/20 border border-white/5 text-[#888] hover:text-white'}`}
            >
               <Circle className={`w-3.5 h-3.5 lg:w-3 lg:h-3 ${isLoopRecording ? 'fill-current' : ''}`} /> {isLoopRecording ? 'Dubbing' : 'Live Dub'}
            </button>
            <button 
               onClick={() => setIsQuantize(!isQuantize)}
               className={`flex items-center gap-1 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-2 py-2 lg:px-1.5 lg:py-1.5 rounded-md transition-colors border ${isQuantize ? 'bg-[#c934ff]/10 text-[#c934ff] border-[#c934ff]/30' : 'bg-black/20 border-white/5 text-[#888] hover:text-white'}`}
               title="Quantize to 16th notes"
            >
               Quant
            </button>
            <button 
               onClick={() => setIsLooping(!isLooping)}
               className={`flex items-center gap-1.5 text-[9px] lg:text-[8px] font-bold uppercase tracking-widest px-3 py-2 lg:px-2 lg:py-1.5 rounded-md transition-colors border ${isLooping ? 'bg-[#00d0ff]/10 text-[#00d0ff] border-[#00d0ff]/30' : 'bg-black/20 border-white/5 text-[#888] hover:text-white'}`}
            >
               <Repeat className="w-3.5 h-3.5 lg:w-3 lg:h-3" /> Loop
            </button>
            <button onClick={clearLoop} className="text-[#555] hover:text-red-400 text-[9px] font-bold uppercase transition-colors px-2">Clear</button>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-max">
        {['kick', 'snare', 'hatCl', 'clap'].map((track) => (
          <div key={track} className="flex gap-2 lg:gap-4 items-center">
            <span className="w-10 lg:w-16 text-[8px] lg:text-[10px] font-mono font-medium text-[#777] shadow-sm uppercase text-right tracking-widest">{track}</span>
            <div className="flex gap-1 lg:gap-2 flex-1">
              {sequence[track].map((isActive: boolean, i: number) => (
                <div 
                  key={i}
                  onClick={() => toggleStep(track, i)} 
                  className={`w-8 lg:flex-1 h-6 lg:h-8 rounded-[4px] cursor-pointer transition-all duration-75
                    ${i % 4 === 0 ? 'ml-1.5 lg:ml-2' : ''}
                    ${isActive 
                      ? (track === 'hatCl' || track === 'clap' ? 'bg-[#00d0ff] shadow-[0_0_12px_rgba(0,208,255,0.4)] scale-[1.02]' : 'bg-[#c934ff] shadow-[0_0_12px_rgba(201,52,255,0.4)] scale-[1.02]')
                      : 'bg-white/5 hover:bg-white/10'
                    }
                    ${isPlaying && currentStep === i ? 'ring-2 ring-white/50 scale-105 z-10 relative' : ''}
                  `}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
