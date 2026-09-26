import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileAudio,
  Mic,
  FileText
} from 'lucide-react';
import { AudioUploadSection } from './AudioUploadSection';

interface TranscriptInputSectionProps {
  transcript: string;
  setTranscript: (text: string) => void;
  contextNotes: string;
  setContextNotes: (notes: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onAudioTranscribeAndAnalyze: (audioBase64: string, mimeType: string, audioFile: File | null) => Promise<void>;
  isProcessingAudio: boolean;
  audioProcessingStage: string;
}

export const TranscriptInputSection: React.FC<TranscriptInputSectionProps> = ({
  transcript,
  setTranscript,
  contextNotes,
  setContextNotes,
  onAnalyze,
  isAnalyzing,
  onAudioTranscribeAndAnalyze,
  isProcessingAudio,
  audioProcessingStage,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'custom'>('audio');
  const [showContextNotes, setShowContextNotes] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const lineCount = transcript.trim() ? transcript.split('\n').length : 0;
  const charCount = transcript.length;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setTranscript(content);
        setActiveTab('custom');
      }
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Title & Value Proposition */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Multilingual Semantic Conversion & Intelligence
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Discussion Conversion Workbench
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
          Upload audio or enter a discussion transcript. Convert conversations into 
          Core Concepts, Conceptual Relationship Graphs, Structured Takeaways, and Language Insights without limits.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800 mb-6 justify-center">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === 'audio'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileAudio className="w-4 h-4 text-cyan-400" />
          <span>Audio Conversion (File or Mic)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === 'custom'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Text Transcript Conversion</span>
          {transcript.trim() && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Loaded
            </span>
          )}
        </button>
      </div>

      {/* 1. AUDIO UPLOAD VIEW */}
      {activeTab === 'audio' && (
        <div className="mb-6">
          <AudioUploadSection
            onAudioTranscribeAndAnalyze={onAudioTranscribeAndAnalyze}
            isProcessing={isProcessingAudio}
            processingStage={audioProcessingStage}
          />
        </div>
      )}

      {/* 2. TEXT TRANSCRIPT VIEW */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative rounded-xl border transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-800 bg-slate-900/60 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50'
            }`}
          >
            {/* Header Bar above textarea */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/80 text-xs text-slate-400 bg-slate-900/90 rounded-t-xl">
              <span className="font-medium text-slate-300">Transcript Input</span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span>{lineCount} lines</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.vtt,.srt,.json,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <FileUp className="w-3 h-3" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Text Area */}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste any multi-language discussion transcript here without length limits. Format as:
[00:00:15] Speaker 1: spoken dialogue...
[00:00:45] Speaker 2: response in another language...

(Or plain text dialogue with speaker prefixes)"
              className="w-full h-80 p-4 bg-transparent font-mono text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
              disabled={isAnalyzing}
            />

            {/* Drag Overlay Hint */}
            {dragActive && (
              <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xs flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-400 z-10">
                <div className="text-center">
                  <FileUp className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-white">Drop transcript file here</p>
                  <p className="text-xs text-slate-400">Supports .txt, .vtt, .srt, .json, .md</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Full unconstrained conversion into Core Concepts, Relational Graph, Structured Takeaways, and Language Insights.
              </span>
            </div>

            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || !transcript.trim()}
              className={`w-full sm:w-auto min-w-[240px] px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2.5 transition-all duration-300 ${
                isAnalyzing || !transcript.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                  : 'bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-500 hover:from-indigo-400 hover:via-violet-500 hover:to-cyan-400 text-white shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Converting & Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convert & Analyze Discussion</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Optional Context Notes Accordion */}
      <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <button
          type="button"
          onClick={() => setShowContextNotes(!showContextNotes)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Optional: Add meeting background or industry context</span>
          </div>
          {showContextNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showContextNotes && (
          <div className="p-4 pt-1 border-t border-slate-800/60">
            <input
              type="text"
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g. Bilingual engineering huddle, legal arbitration, medical consortium"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80"
            />
          </div>
        )}
      </div>
    </div>
  );
};
