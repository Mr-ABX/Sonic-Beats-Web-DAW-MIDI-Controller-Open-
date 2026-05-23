import React, { RefObject } from 'react';
import { Undo2, Redo2, Download, Circle, Settings } from 'lucide-react';

interface TopBarProps {
  visualizerMode: 'Pulse' | 'Oscilloscope' | 'Spectrum';
  setVisualizerMode: (val: 'Pulse' | 'Oscilloscope' | 'Spectrum') => void;
  pulse: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  audioDownloadUrl: string | null;
  isRecordingAudio: boolean;
  toggleAudioRecord: () => void;
  setShowSettings: (val: boolean) => void;
}

export function TopBar({
  visualizerMode,
  setVisualizerMode,
  pulse,
  canvasRef,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  audioDownloadUrl,
  isRecordingAudio,
  toggleAudioRecord,
  setShowSettings
}: TopBarProps) {
  return (
    <div className="bg-[#0c0c0e]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-2.5 md:p-3 flex flex-col md:flex-row justify-between md:items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] relative z-20 w-full">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl shrink-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm tracking-widest transition-all duration-75 relative overflow-hidden border border-white/10 shadow-[inner_0_2px_10px_rgba(0,0,0,0.8)]`}>
           {visualizerMode === 'Pulse' && <div className="absolute inset-0 bg-[#a120cc]" style={{ opacity: 0.2 + pulse, transform: `scale(${1 + pulse*0.5})` }} />}
           <canvas ref={canvasRef} width={48} height={48} className="absolute inset-0 w-full h-full" />
           <span className="relative z-10 mix-blend-difference text-[#fff]">SB</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 ml-1 md:ml-0">
            <h1 className="text-white text-sm md:text-base font-bold tracking-[0.15em] uppercase">Sonic Beats</h1>
            <span className="hidden sm:inline-block text-[10px] bg-[#2a1b32] text-[#c671f0] px-1.5 py-0.5 rounded font-mono tracking-wider font-semibold border border-[#3b2347]">V1.3 OS</span>
          </div>
          <div className="flex items-center gap-2 ml-1 md:ml-0 mt-0.5">
            <button onClick={() => setVisualizerMode('Pulse')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-colors ${visualizerMode === 'Pulse' ? 'border-[#00d0ff] text-[#00d0ff] bg-[#00d0ff]/10' : 'border-white/5 text-[#666] hover:text-white'}`}>Pulse</button>
            <button onClick={() => setVisualizerMode('Oscilloscope')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-colors ${visualizerMode === 'Oscilloscope' ? 'border-[#00d0ff] text-[#00d0ff] bg-[#00d0ff]/10' : 'border-white/5 text-[#666] hover:text-white'}`}>Scope</button>
            <button onClick={() => setVisualizerMode('Spectrum')} className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-colors ${visualizerMode === 'Spectrum' ? 'border-[#00d0ff] text-[#00d0ff] bg-[#00d0ff]/10' : 'border-white/5 text-[#666] hover:text-white'}`}>Spec</button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
         <div className="flex items-center gap-1 mx-1 md:mx-2">
             <button onClick={onUndo} disabled={!canUndo} className={`p-1.5 rounded-lg transition-colors ${canUndo ? 'text-white bg-white/10 hover:bg-white/20' : 'text-white/20 bg-transparent cursor-not-allowed'}`} title="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
             <button onClick={onRedo} disabled={!canRedo} className={`p-1.5 rounded-lg transition-colors ${canRedo ? 'text-white bg-white/10 hover:bg-white/20' : 'text-white/20 bg-transparent cursor-not-allowed'}`} title="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
         </div>
         {audioDownloadUrl && (
           <a href={audioDownloadUrl} download="sonic-beats-mix.webm" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors bg-[#00d0ff]/10 text-[#00d0ff] border border-[#00d0ff]/30 hover:bg-[#00d0ff]/20">
             <Download className="w-3 h-3 hidden sm:block" /> Get Mix
           </a>
         )}
         <button 
           onClick={toggleAudioRecord}
           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-semibold tracking-wider transition-colors border ${isRecordingAudio ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-black/20 text-[#888] border-white/5 hover:text-white'}`}
         >
            <Circle className={`w-3 h-3 ${isRecordingAudio ? 'fill-current' : ''} hidden sm:block`} /> {isRecordingAudio ? 'Recording' : 'Rec Master'}
         </button>
         <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 text-[#888] border border-white/5 hover:bg-white/5 hover:text-white transition-colors text-[10px] uppercase font-semibold tracking-widest">
           <Settings className="w-3 h-3" /> <span className="hidden sm:block">Settings</span>
         </button>
      </div>
    </div>
  );
}
