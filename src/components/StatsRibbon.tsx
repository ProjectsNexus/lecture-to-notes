import React from 'react';
import { Languages, Network, BookOpen, Globe2, Users, Flame } from 'lucide-react';
import { AnalysisResult } from '../types';

interface StatsRibbonProps {
  result: AnalysisResult;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StatsRibbon: React.FC<StatsRibbonProps> = ({ result, activeTab, setActiveTab }) => {
  const languagePalette = ['bg-indigo-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

  return (
    <div className="bg-slate-900/60 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Languages Breakdown */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>Detected Discussion Languages ({result.detectedLanguages.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {result.detectedLanguages.map((lang, idx) => (
              <div
                key={lang.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    languagePalette[idx % languagePalette.length]
                  }`}
                />
                <span className="font-semibold text-slate-200">{lang.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">{lang.percentage}%</span>
              </div>
            ))}
          </div>

          {/* Visual Percentage Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            {result.detectedLanguages.map((lang, idx) => (
              <div
                key={lang.name}
                style={{ width: `${lang.percentage}%` }}
                className={`${languagePalette[idx % languagePalette.length]} h-full transition-all duration-500`}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
        </div>

        {/* Metric Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeTab === 'concepts'
                ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Core Topics</span>
              <Flame className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {result.coreConcepts.length}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeTab === 'summary'
                ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Linkages</span>
              <Network className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {result.conceptualSummary.conceptRelationships.length}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeTab === 'notes'
                ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Notes & Jargon</span>
              <BookOpen className="w-3 h-3 text-violet-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {result.structuredNotes.keyTakeaways.length + result.structuredNotes.technicalJargon.length}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeTab === 'insights'
                ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Language Nuance</span>
              <Globe2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {result.languageInsights.contextDependentConcepts.length}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
