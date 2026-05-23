import React from 'react';
import { Circle } from 'lucide-react';

interface PerformanceAreaProps {
  activeNotes: Set<string>;
  triggerDrum: (id: string) => void;
  triggerNote: (id: string, freq: number) => void;
  releaseNote: (id: string) => void;
  DRUM_PADS: any[];
  PIANO_KEYS: any[];
}

function BlackKey({ data, isActive, onTrigger, onRelease }: { data: any, isActive: boolean, onTrigger: () => void, onRelease: () => void }) {
  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); onTrigger(); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      className={`
        absolute top-0 right-0 translate-x-[50%] w-[60%] h-full rounded-b-md z-10
        pointer-events-auto cursor-pointer transition-all duration-75 flex items-end justify-center pb-2 border-x border-[#111] origin-top
        ${isActive ? 'bg-[#43105e] border-b-2 border-b-[#c934ff] shadow-[0_0_15px_rgba(201,52,255,0.5)] scale-y-95' : 'bg-[#151515] border-b-2 border-b-[#000] shadow-xl scale-y-100'}
      `}
    >
      <span className={`font-mono text-[8px] md:text-[9px] uppercase font-bold ${isActive ? 'text-white' : 'text-[#444]'}`}>
        [{data.keyBind}]
      </span>
    </div>
  );
}

export function PerformanceArea({
  activeNotes, triggerDrum, triggerNote, releaseNote, DRUM_PADS, PIANO_KEYS
}: PerformanceAreaProps) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex-1">
      <div className="flex items-center justify-between border-b border-[#222] pb-2">
        <div className="flex items-center gap-2">
           <Circle className={`w-3 h-3 text-[#18a058] transition-colors ${activeNotes.size > 0 ? 'fill-current shadow-[0_0_8px_rgba(24,160,88,1)]' : ''}`} />
           <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Performance Surface</h2>
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
                relative aspect-square rounded-lg md:rounded-xl cursor-pointer select-none transition-all duration-75
                flex flex-col items-center justify-center p-2
                ${isActive 
                  ? isBlue 
                    ? 'border border-[#00d0ff] bg-[#1a2f3a] shadow-[0_0_15px_rgba(0,208,255,0.3)] scale-95' 
                    : 'border border-[#a120cc] bg-[#2a1b32] shadow-[0_0_15px_rgba(161,32,204,0.4)] scale-95'
                  : 'border border-transparent bg-[#161616] hover:bg-[#1c1c1c] hover:border-[#333] scale-100'
                }
              `}
            >
              {pad.keyBind && <span className="absolute top-2 left-2 text-[8px] md:text-[10px] font-mono font-medium text-[#444]">[{pad.keyBind.toUpperCase()}]</span>}
              
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

      <div className="relative h-28 md:h-40 flex justify-center w-full isolate bg-[#161616] border border-[#222] rounded-xl overflow-hidden mt-auto">
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
                    transition-all duration-75 cursor-pointer flex items-end justify-center pb-2 md:pb-4 z-0 origin-top
                    ${isActive ? 'bg-gradient-to-t from-[#c934ff]/30 to-white/90 shadow-[inset_0_-4px_15px_rgba(201,52,255,0.5)] scale-y-95' : 'bg-[#e5e5e5] hover:bg-white scale-y-100'}
                  `}
                >
                  <span className={`font-mono text-[9px] md:text-[10px] font-bold uppercase transition-colors ${isActive ? 'text-[#811abf]' : 'text-[#999]'}`}>
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
    </div>
  );
}
