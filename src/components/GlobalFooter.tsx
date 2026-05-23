import React from 'react';

interface GlobalFooterProps {
  pulse: number;
  drumKeyBinds: any[];
  pianoKeyBinds: any[];
}

export function GlobalFooter({ pulse, drumKeyBinds, pianoKeyBinds }: GlobalFooterProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 py-4 gap-4 relative w-full lg:w-[1280px] max-w-[1280px]">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${pulse > 0.1 ? 'bg-[#00d0ff] shadow-[0_0_10px_rgba(0,208,255,0.8)]' : 'bg-white/20 shadow-[0_0_5px_rgba(255,255,255,0.1)]'} transition-colors duration-75`} />
        <span className="text-[#888] text-[8px] font-mono tracking-widest font-bold uppercase transition-colors">SYSTEM READY</span>
        <span className="text-[#555] text-[8px] font-mono tracking-widest hidden sm:inline font-bold uppercase">AUDIO ENGINE LIVE</span>
      </div>

      <div className="flex flex-col gap-1 items-end">
         <span className="text-[#888] text-[8px] font-mono tracking-widest uppercase font-bold">Active Binds</span>
         <div className="flex flex-wrap gap-1.5 justify-end max-w-sm text-[8px] font-mono text-[#666]">
            {drumKeyBinds.slice(0, 4).map((b: any) => (
              <span key={b.id} className="bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md"><strong className="text-[#c934ff] uppercase mr-1">{b.keyBind}</strong> {b.id}</span>
            ))}
            {pianoKeyBinds.slice(0, 7).map((b: any) => (
              <span key={b.id} className="bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md"><strong className="text-[#00d0ff] uppercase mr-1">{b.keyBind}</strong> note</span>
            ))}
            <span className="text-[#555] italic px-1 self-center">...more in settings</span>
         </div>
      </div>
    </div>
  );
}
