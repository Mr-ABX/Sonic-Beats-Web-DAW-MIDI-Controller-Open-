import React from 'react';

interface GlobalFooterProps {
  pulse: number;
  drumKeyBinds: any[];
  pianoKeyBinds: any[];
}

export function GlobalFooter({ pulse, drumKeyBinds, pianoKeyBinds }: GlobalFooterProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 py-4 gap-4">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${pulse > 0.1 ? 'bg-[#00d0ff] shadow-[0_0_8px_rgba(0,208,255,1)]' : 'bg-[#18a058] shadow-[0_0_5px_rgba(24,160,88,0.8)]'} transition-colors duration-75`} />
        <span className="text-[#555] text-[8px] font-mono tracking-[0.2em] font-semibold">SYSTEM READY</span>
        <span className="text-[#333] text-[8px] font-mono tracking-[0.2em] hidden sm:inline">AUDIO CONTEXT: ACTIVE</span>
      </div>

      <div className="flex flex-col gap-1 items-end">
         <span className="text-[#444] text-[8px] font-mono tracking-[0.2em] uppercase">Active Key Bindings</span>
         <div className="flex flex-wrap gap-2 justify-end max-w-sm text-[8px] font-mono text-[#666]">
            {drumKeyBinds.slice(0, 4).map((b: any) => (
              <span key={b.id} className="bg-[#111] border border-[#222] px-1.5 py-0.5 rounded text-[#888]"><strong className="text-[#c934ff] uppercase mr-1">{b.keyBind}</strong> {b.id}</span>
            ))}
            {pianoKeyBinds.slice(0, 7).map((b: any) => (
              <span key={b.id} className="bg-[#111] border border-[#222] px-1.5 py-0.5 rounded text-[#888]"><strong className="text-[#00d0ff] uppercase mr-1">{b.keyBind}</strong> note</span>
            ))}
            <span className="text-[#444] italic">...and more in settings</span>
         </div>
      </div>
    </div>
  );
}
