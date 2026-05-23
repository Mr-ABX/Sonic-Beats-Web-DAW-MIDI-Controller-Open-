import React from 'react';

interface BindsProps {
  pianoBinds: { id: string, keyBind: string }[];
  drumBinds: { id: string, keyBind: string }[];
  onPianoChange: (arr: any) => void;
  onDrumChange: (arr: any) => void;
}

export function SettingsKeyMapper({ pianoBinds, drumBinds, onPianoChange, onDrumChange }: BindsProps) {
  const handleDrop = (e: React.DragEvent, targetId: string, isTargetPiano: boolean) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const isSourcePiano = pianoBinds.some(b => b.id === sourceId);
    
    let sourceBind = pianoBinds.find(b => b.id === sourceId) || drumBinds.find(b => b.id === sourceId);
    let targetBind = pianoBinds.find(b => b.id === targetId) || drumBinds.find(b => b.id === targetId);

    if (sourceBind && targetBind) {
      const sourceKeyStr = sourceBind.keyBind;
      const targetKeyStr = targetBind.keyBind;

      let newPiano = [...pianoBinds];
      let newDrum = [...drumBinds];

      if (isSourcePiano) {
        newPiano = newPiano.map(b => b.id === sourceId ? { ...b, keyBind: targetKeyStr } : b);
      } else {
        newDrum = newDrum.map(b => b.id === sourceId ? { ...b, keyBind: targetKeyStr } : b);
      }

      if (isTargetPiano) {
        newPiano = newPiano.map(b => b.id === targetId ? { ...b, keyBind: sourceKeyStr } : b);
      } else {
        newDrum = newDrum.map(b => b.id === targetId ? { ...b, keyBind: sourceKeyStr } : b);
      }

      onPianoChange(newPiano);
      onDrumChange(newDrum);
      localStorage.setItem('vibe_piano_binds', JSON.stringify(newPiano));
      localStorage.setItem('vibe_drum_binds', JSON.stringify(newDrum));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const BindItem = ({ b, isPiano }: { b: any, isPiano: boolean }) => {
    // Determine the label context
    const labelContext = isPiano ? (b.id.replace(/[0-9]/g, '')) : (b.id.toUpperCase().substring(0,4));

    return (
      <div 
        draggable 
        onDragStart={(e) => handleDragStart(e, b.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, b.id, isPiano)}
        className="flex items-center justify-between bg-[#111] border border-[#222] p-1.5 rounded cursor-grab active:cursor-grabbing hover:border-[#444] transition-colors"
      >
        <span className="text-[#888] text-[9px] uppercase tracking-wider pl-1 font-mono">{labelContext}</span>
        <span className="bg-[#2a1b32] text-[#c671f0] border border-[#3b2347] rounded px-2 py-0.5 text-[9px] font-mono uppercase font-bold min-w-[24px] text-center shadow-sm">
          {b.keyBind || '-'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h3 className="text-[#fff] text-xs font-bold uppercase mb-1">Visual Mapping Override</h3>
        <span className="text-[9px] text-[#888] leading-relaxed">Drag and drop key badges below to swap hardware mappings or computer keys instantly.</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <h4 className="text-[#00d0ff] text-[9px] font-bold uppercase mb-2 tracking-widest border-b border-[#222] pb-1">Synth Keys</h4>
          <div className="flex flex-col gap-1.5">
            {pianoBinds.map(b => <div key={b.id}><BindItem b={b} isPiano={true} /></div>)}
          </div>
        </div>
        <div>
          <h4 className="text-[#c934ff] text-[9px] font-bold uppercase mb-2 tracking-widest border-b border-[#222] pb-1">Drum Pads</h4>
          <div className="flex flex-col gap-1.5">
            {drumBinds.map(b => <div key={b.id}><BindItem b={b} isPiano={false} /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
