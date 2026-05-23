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
  sequence, currentStep, toggleStep
}: SequencerPanelProps) {
  return (
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
        {['kick', 'snare', 'hatCl', 'clap'].map((track) => (
          <div key={track} className="flex gap-2 lg:gap-4 items-center">
            <span className="w-10 lg:w-16 text-[8px] lg:text-[10px] font-mono font-bold text-[#666] uppercase text-right tracking-widest">{track}</span>
            <div className="flex gap-1 lg:gap-2 flex-1">
              {sequence[track].map((isActive: boolean, i: number) => (
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
  );
}
