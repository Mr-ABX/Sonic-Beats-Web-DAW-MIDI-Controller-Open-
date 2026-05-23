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
             <button onClick={onUndo} disabled={!canUndo} className={`p-1.5 rounded transition-colors ${canUndo ? 'text-white bg-[#222] hover:bg-[#333]' : 'text-[#444] bg-[#111] cursor-not-allowed'}`} title="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
             <button onClick={onRedo} disabled={!canRedo} className={`p-1.5 rounded transition-colors ${canRedo ? 'text-white bg-[#222] hover:bg-[#333]' : 'text-[#444] bg-[#111] cursor-not-allowed'}`} title="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
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
  );
}
