import React from 'react';
import { Languages, Sparkles, FileText, Download, Volume2, MessageSquareText, RotateCcw, History } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenExport?: () => void;
  onOpenAudioBriefing?: () => void;
  onOpenChat?: () => void;
  onOpenSavedConversions?: () => void;
  savedCount?: number;
  hasAnalysis: boolean;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenExport,
  onOpenAudioBriefing,
  onOpenChat,
  onOpenSavedConversions,
  savedCount = 0,
  hasAnalysis,
  isAnalyzing,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Languages className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Polyglot<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Scribe</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multilingual Discussion Intelligence & Cultural Concept Mapping
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Always accessible: Saved Conversions (3-month storage) */}
          {onOpenSavedConversions && (
            <button
              onClick={onOpenSavedConversions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
              title="Saved Conversions (Stored for 3 months without logins)"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Saved Conversions</span>
              <span className="sm:hidden">Saved</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {savedCount}
                </span>
              )}
            </button>
          )}

          {hasAnalysis && (
            <>
              {onOpenAudioBriefing && (
                <button
                  onClick={onOpenAudioBriefing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                  title="Generate spoken audio briefing with Gemini TTS"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">Audio Briefing</span>
                </button>
              )}

              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                  title="Ask questions about this transcript"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-violet-400" />
                  <span className="hidden md:inline">Q&A Chat</span>
                </button>
              )}

              {onOpenExport && (
                <button
                  onClick={onOpenExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-200 bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Report</span>
                </button>
              )}

              <button
                onClick={onReset}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                title="Start a new conversion"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">New Conversion</span>
              </button>
            </>
          )}

          {!hasAnalysis && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Engine Active</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

