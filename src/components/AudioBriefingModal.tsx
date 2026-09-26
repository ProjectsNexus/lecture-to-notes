import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Headphones, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { pcmBase64ToWavBlobUrl } from '../utils/audioUtils';

interface AudioBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  executiveSummary: string;
  keyTakeaways: string[];
}

export const AudioBriefingModal: React.FC<AudioBriefingModalProps> = ({
  isOpen,
  onClose,
  executiveSummary,
  keyTakeaways,
}) => {
  const [voice, setVoice] = useState('Kore');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate briefing narrative text (~400 words)
  const briefingScript = `Multilingual Discussion Briefing. ${executiveSummary} Key Takeaways: ${keyTakeaways.slice(0, 3).join('. ')}. End of summary.`;

  const handleGenerateAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-audio-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: briefingScript,
          voice: voice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize speech briefing.');
      }

      const data = await response.json();
      if (data.audioBase64) {
        const url = pcmBase64ToWavBlobUrl(data.audioBase64, data.sampleRate || 24000);
        setAudioUrl(url);
        setIsPlaying(true);
      } else {
        throw new Error('No audio returned from speech synthesis.');
      }
    } catch (err: any) {
      console.error('Audio synthesis failed:', err);
      setError(err.message || 'Speech generation encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Audio Executive Briefing
              </h3>
              <p className="text-xs text-slate-400">
                Synthesized with Gemini 3.8 Flash Lite TTS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Voice Persona
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'Kore', name: 'Kore', tag: 'Warm & Crisp' },
              { id: 'Fenrir', name: 'Fenrir', tag: 'Deep & Authoritative' },
              { id: 'Puck', name: 'Puck', tag: 'Bright & Conversational' },
              { id: 'Zephyr', name: 'Zephyr', tag: 'Calm & Precise' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVoice(v.id);
                  if (audioUrl) setAudioUrl(null);
                }}
                className={`p-2 rounded-xl border text-center transition-all ${
                  voice === v.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{v.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{v.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Script Preview */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-32 overflow-y-auto leading-relaxed">
          <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
            Synthesized Script:
          </span>
          {briefingScript}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Audio Player Controls */}
        <div className="pt-2">
          {audioUrl ? (
            <div className="space-y-3">
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all"
                      style={{
                        width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      {Math.floor(currentTime / 60)}:
                      {Math.floor(currentTime % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                    <span>
                      {Math.floor(duration / 60)}:
                      {Math.floor(duration % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAudio}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateAudio}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Voice Audio...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Generate Audio Briefing</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
