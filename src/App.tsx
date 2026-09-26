/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  Layers, 
  Network, 
  BookOpen, 
  Globe2, 
  FileText,
  Volume2,
  MessageSquareText,
  Download,
  RotateCcw,
  Columns,
  Maximize2,
  Clock,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { Header } from './components/Header';
import { TranscriptInputSection } from './components/TranscriptInputSection';
import { StatsRibbon } from './components/StatsRibbon';
import { CoreConceptsTab } from './components/CoreConceptsTab';
import { ConceptualSummaryTab } from './components/ConceptualSummaryTab';
import { StructuredNotesTab } from './components/StructuredNotesTab';
import { LanguageInsightsTab } from './components/LanguageInsightsTab';
import { FullTranscriptTab } from './components/FullTranscriptTab';
import { AudioBriefingModal } from './components/AudioBriefingModal';
import { ChatTranscriptDrawer } from './components/ChatTranscriptDrawer';
import { ExportModal } from './components/ExportModal';
import { SavedConversionsModal } from './components/SavedConversionsModal';
import { 
  saveConversion, 
  getSavedConversions, 
  pruneExpiredConversions,
  formatTimeRemaining,
  SavedConversion 
} from './utils/conversionStorage';
import { processAudioIntoPayloadSafeChunks } from './utils/audioChunker';
import { AnalysisResult } from './types';

export default function App() {
  const [transcript, setTranscript] = useState<string>('');
  const [contextNotes, setContextNotes] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Audio Upload & Playback State
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [audioProcessingStage, setAudioProcessingStage] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'concepts' | 'summary' | 'notes' | 'insights' | 'transcript'>('concepts');
  const [filterConceptTitle, setFilterConceptTitle] = useState<string | null>(null);

  // Representation View Mode: 'tabs' (Full Tabs) vs 'split' (Side-by-Side Transcript + Analysis)
  const [viewMode, setViewMode] = useState<'tabs' | 'split'>('tabs');

  // 3-Month Storage State (Zero login needed)
  const [savedCount, setSavedCount] = useState<number>(0);
  const [isSavedConversionsOpen, setIsSavedConversionsOpen] = useState<boolean>(false);
  const [currentSavedConversionId, setCurrentSavedConversionId] = useState<string | null>(null);
  const [activeConversionLifespan, setActiveConversionLifespan] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Modals & Panels
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAudioBriefingOpen, setIsAudioBriefingOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // On mount: prune conversions older than 3 months & update count
  useEffect(() => {
    pruneExpiredConversions()
      .then(() => refreshSavedCount())
      .catch((err) => console.warn('Prune on start error:', err));
  }, []);

  const refreshSavedCount = async () => {
    try {
      const list = await getSavedConversions();
      setSavedCount(list.length);
    } catch (e) {
      console.warn('Count refresh error:', e);
    }
  };

  const persistNewlyConverted = async (
    dialogueText: string,
    notesText: string,
    result: AnalysisResult,
    audioName?: string
  ) => {
    try {
      const saved = await saveConversion({
        transcript: dialogueText,
        contextNotes: notesText,
        analysisResult: result,
        audioFileName: audioName,
      });

      setCurrentSavedConversionId(saved.id);
      await refreshSavedCount();

      const timeInfo = formatTimeRemaining(saved.expiresAt);
      setActiveConversionLifespan(timeInfo.text);

      setSaveToast({
        title: 'Conversion Saved for 3 Months',
        message: `Stored securely on this device without logins. Will auto-remove in ${timeInfo.days} days.`,
      });

      setTimeout(() => {
        setSaveToast(null);
      }, 6000);
    } catch (err) {
      console.warn('Auto-save error:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          contextNotes: contextNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned HTTP ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      setActiveTab('concepts');
      setFilterConceptTitle(null);

      // Auto-save conversion for next 3 months without logins
      persistNewlyConverted(transcript.trim(), contextNotes.trim(), data, uploadedAudioFile?.name);
    } catch (err: any) {
      console.error('Failed to analyze transcript:', err);
      setAnalysisError(err.message || 'Failed to analyze transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAudioTranscribeAndAnalyze = async (file: File) => {
    setIsProcessingAudio(true);
    setAnalysisError(null);
    setAudioProcessingStage('Preparing audio in browser (resampling to 16kHz speech fidelity)...');

    setUploadedAudioFile(file);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setUploadedAudioUrl(URL.createObjectURL(file));

    try {
      // Step 1: Client-side downsample and slice into payload-safe chunks (<3MB each)
      // This eliminates Vercel 4.5MB serverless limits for files of ANY size
      const chunks = await processAudioIntoPayloadSafeChunks(file, (msg) => {
        setAudioProcessingStage(msg);
      });

      if (chunks.length === 0) {
        throw new Error('No audio data could be extracted from this file.');
      }

      let runningTranscript = '';

      // Step 2: Transcribe each chunk sequentially with continuous speaker & timing context
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const mins = Math.floor(chunk.startTimeSeconds / 60);
        const secs = Math.floor(chunk.startTimeSeconds % 60);
        const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (chunks.length > 1) {
          setAudioProcessingStage(
            `Transcribing part ${i + 1} of ${chunks.length} [${timeFormatted}] with Gemini...`
          );
        } else {
          setAudioProcessingStage('Transcribing audio verbatim with Gemini (speaker diarization & multilingual fidelity)...');
        }

        const transcribeRes = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: chunk.base64,
            mimeType: chunk.mimeType,
            timeOffsetSeconds: chunk.startTimeSeconds,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            previousTranscript: runningTranscript.slice(-400),
            contextNotes: contextNotes.trim(),
          }),
        });

        if (!transcribeRes.ok) {
          const errJson = await transcribeRes.json().catch(() => ({}));
          if (transcribeRes.status === 404) {
            throw new Error(
              'API route /api/transcribe-audio returned 404 Not Found. Please ensure vercel.json and api/ routes are deployed, and GEMINI_API_KEY is configured in your Vercel Project Settings.'
            );
          }
          if (transcribeRes.status === 413) {
            throw new Error(
              `Chunk ${i + 1} exceeded payload limit. Please try again.`
            );
          }
          throw new Error(
            errJson.error || `Failed to transcribe audio chunk ${i + 1} of ${chunks.length} (HTTP ${transcribeRes.status}).`
          );
        }

        const { transcript: chunkTranscript } = await transcribeRes.json();
        if (chunkTranscript && chunkTranscript.trim()) {
          runningTranscript = runningTranscript
            ? `${runningTranscript}\n\n${chunkTranscript.trim()}`
            : chunkTranscript.trim();
        }
      }

      if (!runningTranscript || !runningTranscript.trim()) {
        throw new Error('No transcript dialogue could be extracted from this audio.');
      }

      setTranscript(runningTranscript);

      // Step 3: Analyze the full transcribed dialogue with all 4 pillars
      setAudioProcessingStage('Extracting Core Concepts, Conceptual Summary, Structured Notes & Language Insights...');
      const analyzeRes = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: runningTranscript,
          contextNotes: contextNotes.trim(),
        }),
      });

      if (!analyzeRes.ok) {
        const errJson = await analyzeRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze the transcribed discussion.');
      }

      const analysisData: AnalysisResult = await analyzeRes.json();
      setAnalysisResult(analysisData);
      setActiveTab('concepts');
      setFilterConceptTitle(null);

      // Auto-save conversion for next 3 months without logins
      persistNewlyConverted(runningTranscript, contextNotes.trim(), analysisData, file.name);
    } catch (err: any) {
      console.error('Audio transcribe & analyze error:', err);
      setAnalysisError(err.message || 'An error occurred during audio transcription or analysis.');
    } finally {
      setIsProcessingAudio(false);
      setAudioProcessingStage('');
    }
  };

  const handleSelectSavedConversion = (saved: SavedConversion) => {
    setTranscript(saved.transcript);
    setContextNotes(saved.contextNotes || '');
    setAnalysisResult(saved.analysisResult);
    setCurrentSavedConversionId(saved.id);
    setActiveTab('concepts');
    setFilterConceptTitle(null);

    if (saved.audioFileName) {
      setUploadedAudioFile(new File([], saved.audioFileName));
    } else {
      setUploadedAudioFile(null);
      setUploadedAudioUrl(null);
    }

    const timeInfo = formatTimeRemaining(saved.expiresAt);
    setActiveConversionLifespan(timeInfo.text);

    setSaveToast({
      title: `Loaded: ${saved.title}`,
      message: `Active from 3-month storage (${timeInfo.text}).`,
    });

    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setTranscript('');
    setContextNotes('');
    setCurrentSavedConversionId(null);
    setActiveConversionLifespan(null);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setUploadedAudioFile(null);
    setUploadedAudioUrl(null);
  };

  const handleExploreConcept = (conceptTitle: string) => {
    setFilterConceptTitle(conceptTitle);
    setActiveTab('summary');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <Header
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSavedConversions={() => setIsSavedConversionsOpen(true)}
        savedCount={savedCount}
        hasAnalysis={!!analysisResult}
        isAnalyzing={isAnalyzing || isProcessingAudio}
      />

      {/* Main Body */}
      <main className="flex-1">
        {/* Error notification banner */}
        {analysisError && (
          <div className="max-w-5xl mx-auto mt-6 px-4">
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Conversion Error</strong>
                  <span>{analysisError}</span>
                </div>
              </div>
              <button
                onClick={() => setAnalysisError(null)}
                className="text-rose-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* State 1: No Analysis Yet -> Conversion Workbench */}
        {!analysisResult && (
          <TranscriptInputSection
            transcript={transcript}
            setTranscript={setTranscript}
            contextNotes={contextNotes}
            setContextNotes={setContextNotes}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            onAudioTranscribeAndAnalyze={handleAudioTranscribeAndAnalyze}
            isProcessingAudio={isProcessingAudio}
            audioProcessingStage={audioProcessingStage}
          />
        )}

        {/* State 2: Analysis Completed -> Multi-Dimensional Representation */}
        {analysisResult && (
          <div className="space-y-6 pb-24">
            {/* Top Stats Ribbon */}
            <StatsRibbon
              result={analysisResult}
              activeTab={activeTab}
              setActiveTab={(tab: any) => setActiveTab(tab)}
            />

            {/* Retention Lifespan Banner (3-Month Policy, No Logins) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Stored Without Login:</span>
                  <span className="text-slate-400">
                    Saved for 3 months (90 days) on your device.
                  </span>
                  {activeConversionLifespan && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {activeConversionLifespan}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSavedConversionsOpen(true)}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View All Saved ({savedCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Source Banner if converted from audio */}
            {uploadedAudioUrl && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Source Audio: {uploadedAudioFile?.name || 'Uploaded Discussion'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Converted & Mapped
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Diarized dialogue and multi-lingual expressions extracted directly from this audio.
                      </p>
                    </div>
                  </div>

                  <audio
                    controls
                    src={uploadedAudioUrl}
                    className="h-8 max-w-full sm:max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Control Bar: Mode Toggle (Tabs vs Split Side-by-Side) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
                {/* Tab Navigation for Right Pane / Command Center */}
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px scrollbar-none">
                  <button
                    onClick={() => {
                      setActiveTab('concepts');
                      setFilterConceptTitle(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'concepts'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>1. Core Concepts</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {analysisResult.coreConcepts.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'summary'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Network className="w-4 h-4" />
                    <span>2. Conceptual Summary</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {analysisResult.conceptualSummary.conceptRelationships.length} Links
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'notes'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>3. Structured Notes</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-violet-950 text-violet-300 border border-violet-500/30">
                      {analysisResult.structuredNotes.keyTakeaways.length + analysisResult.structuredNotes.technicalJargon.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === 'insights'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>4. Language Insights</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {analysisResult.languageInsights.contextDependentConcepts.length} Nuances
                    </span>
                  </button>

                  {viewMode === 'tabs' && (
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'transcript'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Source Transcript</span>
                    </button>
                  )}
                </div>

                {/* Representation Mode Switcher & New Conversion Button */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setViewMode('tabs')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        viewMode === 'tabs'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Single Focus Tabbed View"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Focus View</span>
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        viewMode === 'split'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Side-by-Side Dual Synchronized Representation"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dual Synchronized View</span>
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>New Conversion</span>
                  </button>
                </div>
              </div>

              {/* REPRESENTATION RENDER */}
              <div className="mt-6">
                {viewMode === 'split' ? (
                  /* SPLIT DUAL SYNCHRONIZED REPRESENTATION */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Pane: Verbatim Dialogue & Source Audio */}
                    <div className="lg:col-span-5 sticky top-20 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Verbatim Discussion
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {transcript.split('\n').filter((l) => l.trim().length > 0).length} turns
                        </span>
                      </div>

                      <FullTranscriptTab
                        transcript={transcript}
                        audioUrl={uploadedAudioUrl}
                        audioFileName={uploadedAudioFile?.name}
                      />
                    </div>

                    {/* Right Pane: 4-Pillar Intelligence Outputs */}
                    <div className="lg:col-span-7 space-y-6">
                      {activeTab === 'concepts' && (
                        <CoreConceptsTab
                          concepts={analysisResult.coreConcepts}
                          onSelectConceptToExplore={handleExploreConcept}
                        />
                      )}

                      {activeTab === 'summary' && (
                        <ConceptualSummaryTab
                          summary={analysisResult.conceptualSummary}
                          filterConceptTitle={filterConceptTitle}
                          onClearFilter={() => setFilterConceptTitle(null)}
                        />
                      )}

                      {activeTab === 'notes' && (
                        <StructuredNotesTab notes={analysisResult.structuredNotes} />
                      )}

                      {activeTab === 'insights' && (
                        <LanguageInsightsTab insights={analysisResult.languageInsights} />
                      )}
                    </div>
                  </div>
                ) : (
                  /* FULL-WIDTH TABBED REPRESENTATION */
                  <div>
                    {activeTab === 'concepts' && (
                      <CoreConceptsTab
                        concepts={analysisResult.coreConcepts}
                        onSelectConceptToExplore={handleExploreConcept}
                      />
                    )}

                    {activeTab === 'summary' && (
                      <ConceptualSummaryTab
                        summary={analysisResult.conceptualSummary}
                        filterConceptTitle={filterConceptTitle}
                        onClearFilter={() => setFilterConceptTitle(null)}
                      />
                    )}

                    {activeTab === 'notes' && (
                      <StructuredNotesTab notes={analysisResult.structuredNotes} />
                    )}

                    {activeTab === 'insights' && (
                      <LanguageInsightsTab insights={analysisResult.languageInsights} />
                    )}

                    {activeTab === 'transcript' && (
                      <FullTranscriptTab
                        transcript={transcript}
                        audioUrl={uploadedAudioUrl}
                        audioFileName={uploadedAudioFile?.name}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Controls on bottom-right */}
      {analysisResult && (
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-violet-500/40 hover:border-violet-500 text-white text-xs font-bold shadow-xl shadow-slate-950/80 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            title="Ask follow-up questions about this discussion"
          >
            <MessageSquareText className="w-4 h-4 text-violet-400" />
            <span>Ask Q&A</span>
          </button>

          <button
            onClick={() => setIsAudioBriefingOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-cyan-500/40 hover:border-cyan-500 text-white text-xs font-bold shadow-xl shadow-slate-950/80 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            title="Listen to synthesized audio briefing"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Audio Briefing</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      )}

      {/* Auto-Save Toast Alert */}
      {saveToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm p-4 rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-white">{saveToast.title}</h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {saveToast.message}
                </p>
                <button
                  onClick={() => {
                    setSaveToast(null);
                    setIsSavedConversionsOpen(true);
                  }}
                  className="mt-2 text-[11px] text-cyan-400 hover:text-white font-semibold flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  <span>Open Saved Conversions ({savedCount})</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => setSaveToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <SavedConversionsModal
        isOpen={isSavedConversionsOpen}
        onClose={() => setIsSavedConversionsOpen(false)}
        onSelectConversion={handleSelectSavedConversion}
        currentConversionId={currentSavedConversionId}
      />

      {analysisResult && (
        <>
          <AudioBriefingModal
            isOpen={isAudioBriefingOpen}
            onClose={() => setIsAudioBriefingOpen(false)}
            executiveSummary={analysisResult.conceptualSummary.executiveSummary}
            keyTakeaways={analysisResult.structuredNotes.keyTakeaways.map((k) => k.takeaway)}
          />

          <ChatTranscriptDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            transcript={transcript}
          />

          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            result={analysisResult}
            transcript={transcript}
          />
        </>
      )}
    </div>
  );
}
