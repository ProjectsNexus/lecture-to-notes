import React, { useState, useRef } from 'react';
import { Search, Copy, Check, FileText, Play, Pause, Volume2, FileAudio } from 'lucide-react';

interface FullTranscriptTabProps {
  transcript: string;
  audioUrl?: string | null;
  audioFileName?: string | null;
}

export const FullTranscriptTab: React.FC<FullTranscriptTabProps> = ({ 
  transcript,
  audioUrl,
  audioFileName,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const lines = transcript.split('\n').filter((l) => l.trim().length > 0);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Helper to extract timestamp and speaker if formatted like [00:01:23] Name:
  const parseLine = (line: string) => {
    const timestampMatch = line.match(/^(\[\d{2}:\d{2}(?::\d{2})?\])\s*/);
    const timestamp = timestampMatch ? timestampMatch[1] : null;
    const rest = timestamp ? line.slice(timestamp.length).trim() : line;

    const speakerMatch = rest.match(/^([^:]+):\s*(.*)$/);
    if (speakerMatch) {
      return {
        timestamp,
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].trim(),
      };
    }
    return {
      timestamp,
      speaker: null,
      text: rest,
    };
  };

  const filteredLines = lines.filter((line) =>
    line.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Complete Discussion Transcript</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {lines.length} Turns
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Original recorded dialogue with speaker attributions and multilingual expressions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search transcript..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Player Bar if source audio is present */}
      {audioUrl && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                Source Audio: <strong className="text-white">{audioFileName || 'Uploaded Discussion'}</strong>
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {isPlayingAudio ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Playing
              </span>
            ) : (
              <span>Ready for playback</span>
            )}
          </div>
        </div>
      )}

      {/* Transcript Lines Container */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredLines.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No dialogue lines match your filter "{searchFilter}".
          </div>
        ) : (
          filteredLines.map((line, idx) => {
            const { timestamp, speaker, text } = parseLine(line);

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 transition-colors text-xs sm:text-sm font-sans"
              >
                <div className="flex items-center gap-2 mb-1">
                  {timestamp && (
                    <span className="font-mono text-[11px] text-slate-500">
                      {timestamp}
                    </span>
                  )}
                  {speaker && (
                    <span className="font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-xs">
                      {speaker}
                    </span>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed font-sans pl-1">
                  {text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
