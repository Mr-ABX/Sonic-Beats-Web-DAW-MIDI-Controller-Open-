import React, { useState, useEffect } from 'react';
import { Circle, Columns3, Grip, Keyboard, Waves } from 'lucide-react';

interface PerformanceAreaProps {
  activeNotes: Set<string>;
  triggerDrum: (id: string) => void;
  triggerNote: (id: string, freq: number) => void;
  releaseNote: (id: string) => void;
  DRUM_PADS: any[];
  PIANO_KEYS: any[];
  activePresetCategory?: string;
}

function BlackKey({ data, isActive, onTrigger, onRelease }: { data: any, isActive: boolean, onTrigger: () => void, onRelease: () => void }) {
  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); onTrigger(); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      className={`
        absolute top-0 right-0 translate-x-[50%] w-[65%] h-full rounded-b z-10
        pointer-events-auto cursor-pointer transition-all duration-75 flex items-end justify-center pb-2 origin-top
        ${isActive ? 'bg-[#43105e] border-b-[3px] border-[#c934ff] shadow-[0_0_15px_rgba(201,52,255,0.5)] scale-y-95' : 'bg-[#18181b] border-b-[3px] border-[#09090b] shadow-2xl scale-y-100'}
      `}
    >
      <span className={`font-mono text-[8px] md:text-[9px] uppercase font-semibold ${isActive ? 'text-white' : 'text-[#666]'}`}>
        [{data.keyBind}]
      </span>
    </div>
  );
}

export function PerformanceArea({
  activeNotes, triggerDrum, triggerNote, releaseNote, DRUM_PADS, PIANO_KEYS, activePresetCategory
}: PerformanceAreaProps) {
  const [surfaceMode, setSurfaceMode] = useState<'keyboard' | 'fretboard' | 'grid' | 'strum'>('keyboard');

  useEffect(() => {
    if (!activePresetCategory) return;
    if (activePresetCategory === 'Guitar' || activePresetCategory === 'Strings') {
      setSurfaceMode('strum');
    } else if (activePresetCategory === 'Drum' || activePresetCategory === 'Pad' || activePresetCategory === 'FX') {
      setSurfaceMode('grid');
    } else {
      setSurfaceMode('keyboard');
    }
  }, [activePresetCategory]);

  const STUN_NOTES = [
    { label: 'e1', freq: 329.63, id: 'E4_strum' },
    { label: 'B2', freq: 246.94, id: 'B3_strum' },
    { label: 'G3', freq: 196.00, id: 'G3_strum' },
    { label: 'D4', freq: 146.83, id: 'D3_strum' },
    { label: 'A5', freq: 110.00, id: 'A2_strum' },
    { label: 'E6', freq: 82.41,  id: 'E2_strum' },
  ];

  const handleStrumMove = (e: React.PointerEvent) => {
    if (e.buttons > 0 || e.pointerType === 'touch') {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const noteId = target?.getAttribute('data-note-id');
      const freq = target?.getAttribute('data-note-freq');
      if (noteId && freq && !activeNotes.has(noteId)) {
        triggerNote(noteId, parseFloat(freq));
        setTimeout(() => releaseNote(noteId), 1500); 
      }
    }
  };

  return (
    <div className="bg-[#0c0c0e]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] flex-1">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
           <Circle className={`w-3 h-3 text-[#18a058] transition-colors ${activeNotes.size > 0 ? 'fill-current shadow-[0_0_8px_rgba(24,160,88,1)]' : ''}`} />
           <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest hidden sm:block">Performance Surface</h2>
           <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest sm:hidden">Surface</h2>
        </div>
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
           <button onClick={() => setSurfaceMode('keyboard')} className={`p-1.5 rounded-md transition-colors ${surfaceMode === 'keyboard' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`} title="Keys"><Keyboard className="w-3.5 h-3.5" /></button>
           <button onClick={() => setSurfaceMode('fretboard')} className={`p-1.5 rounded-md transition-colors ${surfaceMode === 'fretboard' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`} title="Strings"><Columns3 className="w-3.5 h-3.5" /></button>
           <button onClick={() => setSurfaceMode('strum')} className={`p-1.5 rounded-md transition-colors ${surfaceMode === 'strum' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`} title="Strum"><Waves className="w-3.5 h-3.5" /></button>
           <button onClick={() => setSurfaceMode('grid')} className={`p-1.5 rounded-md transition-colors ${surfaceMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`} title="Grid"><Grip className="w-3.5 h-3.5" /></button>
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
                relative aspect-square cursor-pointer select-none transition-all duration-75
                flex flex-col items-center justify-center p-2
                ${surfaceMode === 'grid' ? 'rounded-full' : 'rounded-[10px] md:rounded-2xl'}
                ${isActive 
                  ? isBlue 
                    ? 'border border-[#00d0ff]/50 bg-[#00d0ff]/20 shadow-[0_0_20px_rgba(0,208,255,0.3)] scale-[0.97]' 
                    : 'border border-[#a120cc]/50 bg-[#a120cc]/20 shadow-[0_0_20px_rgba(161,32,204,0.3)] scale-[0.97]'
                  : 'border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 scale-100'
                }
              `}
            >
              {pad.keyBind && <span className={`absolute top-2 text-[8px] md:text-[10px] font-mono font-medium text-[#444] ${surfaceMode === 'grid' ? 'left-1/2 -translate-x-1/2' : 'left-2'}`}>[{pad.keyBind.toUpperCase()}]</span>}
              
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

      <div className="relative h-28 md:h-36 flex justify-center w-full isolate bg-black/20 border border-white/5 rounded-xl overflow-hidden mt-auto">
        {surfaceMode === 'keyboard' && (
          <>
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
                        relative flex-1 h-full border-r border-[#1a1a1a] last:border-r-0
                        transition-all duration-75 cursor-pointer flex items-end justify-center pb-2 md:pb-3 z-0 origin-top
                        ${isActive ? 'bg-[#e0e0e0] shadow-[inset_0_-4px_15px_rgba(201,52,255,0.2)] scale-[0.98] rounded-b-md' : 'bg-white hover:bg-[#f0f0f0] scale-100'}
                      `}
                    >
                          <span className={`font-mono text-[9px] md:text-[10px] font-semibold uppercase transition-colors ${isActive ? 'text-[#811abf]' : 'text-[#b0b0b0]'}`}>
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
          </>
        )}

        {surfaceMode === 'fretboard' && (
           <div className="grid grid-cols-4 md:grid-cols-7 w-full h-full p-2 gap-1.5 bg-[#120f14] overflow-y-auto custom-scrollbar">
             {PIANO_KEYS.map((key) => {
               const isActive = activeNotes.has(key.id);
               return (
                 <div
                   key={key.id}
                   onPointerDown={(e) => { e.preventDefault(); triggerNote(key.id, key.freq); }}
                   onPointerUp={() => releaseNote(key.id)}
                   onPointerLeave={() => releaseNote(key.id)}
                   className={`flex flex-col items-center justify-center rounded-lg border transition-all duration-75 cursor-pointer relative overflow-hidden ${isActive ? 'bg-[#a120cc]/40 border-[#c934ff]/60 shadow-[0_0_15px_rgba(161,32,204,0.4)] scale-95' : 'bg-[#18181b] border-white/5 hover:bg-white/5 scale-100'}`}
                 >
                    {isActive && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-[#c934ff]/20 blur-[10px]" />}
                    <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.8)] -translate-y-1/2 pointer-events-none" />
                    <span className={`relative z-10 font-bold uppercase text-[10px] md:text-xs ${isActive ? 'text-white' : 'text-[#888]'}`}>{key.label}</span>
                    <span className={`relative z-10 font-mono text-[8px] uppercase mt-1 ${isActive ? 'text-[#c934ff]' : 'text-[#555]'}`}>[{key.keyBind}]</span>
                 </div>
               )
             })}
           </div>
        )}

        {surfaceMode === 'grid' && (
           <div className="flex flex-wrap w-full h-full p-3 gap-2 md:gap-3 bg-[#0a0a0c] justify-center items-center content-center overflow-y-auto custom-scrollbar">
             {PIANO_KEYS.map((key) => {
               const isActive = activeNotes.has(key.id);
               return (
                 <div
                   key={key.id}
                   onPointerDown={(e) => { e.preventDefault(); triggerNote(key.id, key.freq); }}
                   onPointerUp={() => releaseNote(key.id)}
                   onPointerLeave={() => releaseNote(key.id)}
                   className={`w-11 h-11 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center border transition-all duration-75 cursor-pointer ${isActive ? 'bg-[#00d0ff]/20 border-[#00d0ff]/80 shadow-[0_0_20px_rgba(0,208,255,0.4)] scale-95' : 'bg-white/5 border-white/10 hover:border-white/20 scale-100'}`}
                 >
                    <span className={`font-bold uppercase text-[9px] md:text-[10px] ${isActive ? 'text-[#00d0ff] drop-shadow-[0_0_5px_rgba(0,208,255,0.8)]' : 'text-[#888]'}`}>{key.label}</span>
                    <span className={`font-mono text-[7px] uppercase mt-0 ${isActive ? 'text-white' : 'text-[#555]'}`}>[{key.keyBind}]</span>
                 </div>
               )
             })}
           </div>
        )}

        {surfaceMode === 'strum' && (
           <div 
             className="flex flex-col w-full h-full py-4 gap-4 md:gap-5 bg-[#0a080c] overflow-hidden justify-center items-center relative touch-none select-none px-8 md:px-16"
             onPointerMove={handleStrumMove}
           >
             <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 42px)' }} />
             
             {STUN_NOTES.map((note) => {
               const isActive = activeNotes.has(note.id);
               return (
                 <div key={note.id} className="w-full h-6 md:h-8 flex items-center relative touch-none isolate group">
                    <div 
                      data-note-id={note.id} 
                      data-note-freq={note.freq} 
                      className="absolute inset-y-0 -inset-x-4 cursor-crosshair touch-none z-20"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        triggerNote(note.id, note.freq);
                        setTimeout(() => releaseNote(note.id), 1500);
                      }}
                    />
                    <span className={`absolute -left-6 md:-left-8 font-bold text-[10px] uppercase w-4 text-right transition-colors ${isActive ? 'text-[#c934ff]' : 'text-[#444]'}`}>
                      {note.label}
                    </span>
                    <div className={`w-full pointer-events-none transition-all duration-75 rounded-full relative z-10 ${isActive ? 'bg-[#ffca28] h-[3px] shadow-[0_0_15px_rgba(255,202,40,0.8)] translate-y-[2px]' : 'bg-[#555] h-[2px]'}`}></div>
                 </div>
               )
             })}
           </div>
        )}
      </div>
    </div>
  );
}
