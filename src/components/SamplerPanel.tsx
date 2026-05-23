import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Headphones } from 'lucide-react';

interface SamplerPanelProps {
  onSampleRecorded: (buffer: AudioBuffer | null) => void;
  audioCtxRef: React.RefObject<AudioContext | null>;
  customSample: AudioBuffer | null;
}

export function SamplerPanel({ onSampleRecorded, audioCtxRef, customSample }: SamplerPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true);
        stream.getTracks().forEach(t => t.stop());
      })
      .catch(() => setHasPermission(false));
  }, []);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        const arrayBuffer = await blob.arrayBuffer();
        
        if (audioCtxRef.current) {
          try {
            const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            onSampleRecorded(audioBuffer);
          } catch (e) {
            console.error("Error decoding audio data", e);
          }
        }
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const handlePlaySample = () => {
    if (!customSample || !audioCtxRef.current) return;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = customSample;
    source.connect(audioCtxRef.current.destination);
    source.start();
  };

  const clearSample = () => {
    onSampleRecorded(null);
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <Mic className="w-3.5 h-3.5 text-[#c934ff]" />
        <h2 className="text-[#888] text-[10px] font-bold uppercase tracking-widest">Custom Sampler</h2>
      </div>

      {hasPermission === false && (
        <div className="text-red-400 text-[10px] p-2 bg-red-400/10 rounded-lg">
          Microphone permission denied.
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <button
          onClick={handleRecord}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'}`}
        >
          {isRecording ? <Square className="w-6 h-6 fill-current text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>
        
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#888]">
          {isRecording ? 'Recording...' : customSample ? 'Sample Loaded' : 'Record clap sample'}
        </span>
      </div>

      <div className="flex justify-between gap-2 mt-auto">
        <button
          onClick={handlePlaySample}
          disabled={!customSample}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors ${customSample ? 'bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/30 hover:bg-[#00d0ff]/30' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}
        >
          <Play className="w-3 h-3" /> Preview
        </button>
        <button
          onClick={clearSample}
          disabled={!customSample}
          className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase transition-colors ${customSample ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      {customSample && (
        <div className="mt-2 text-[8px] text-[#00d0ff] flex items-center gap-1 font-mono tracking-widest text-center justify-center">
            <Headphones className="w-3 h-3" /> Replaces "CLAP" Pad & Sequence
        </div>
      )}
    </div>
  );
}
