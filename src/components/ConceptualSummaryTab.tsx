import React, { useState, useMemo } from 'react';
import { ConceptualSummary, ConceptRelationship } from '../types';
import { 
  Network, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  GitFork, 
  Filter,
  Layers,
  ArrowDown,
  Share2,
  Maximize2
} from 'lucide-react';

interface ConceptualSummaryTabProps {
  summary: ConceptualSummary;
  filterConceptTitle?: string | null;
  onClearFilter?: () => void;
}

export const ConceptualSummaryTab: React.FC<ConceptualSummaryTabProps> = ({
  summary,
  filterConceptTitle,
  onClearFilter,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(filterConceptTitle || null);

  const getRelationshipBadge = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('enable')) {
      return {
        label: 'Enables',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        lineColor: 'border-emerald-500/50',
        icon: Zap,
      };
    }
    if (normalized.includes('conflict')) {
      return {
        label: 'Conflicts With',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        lineColor: 'border-rose-500/50',
        icon: AlertTriangle,
      };
    }
    if (normalized.includes('depend')) {
      return {
        label: 'Depends On',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        lineColor: 'border-amber-500/50',
        icon: GitFork,
      };
    }
    if (normalized.includes('reinforce')) {
      return {
        label: 'Reinforces',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        lineColor: 'border-cyan-500/50',
        icon: CheckCircle,
      };
    }
    return {
      label: type.replace('_', ' '),
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      lineColor: 'border-indigo-500/50',
      icon: Network,
    };
  };

  // Extract all unique concept nodes
  const uniqueConcepts = useMemo(() => {
    const set = new Set<string>();
    summary.conceptRelationships.forEach((rel) => {
      set.add(rel.sourceConceptTitle);
      set.add(rel.targetConceptTitle);
    });
    return Array.from(set);
  }, [summary.conceptRelationships]);

  const activeFocus = selectedNode || filterConceptTitle;

  const filteredRelationships = summary.conceptRelationships.filter((rel) => {
    const matchesConcept =
      !activeFocus ||
      rel.sourceConceptTitle.toLowerCase().includes(activeFocus.toLowerCase()) ||
      rel.targetConceptTitle.toLowerCase().includes(activeFocus.toLowerCase());

    const matchesType =
      selectedType === 'all' ||
      rel.relationshipType.toLowerCase().includes(selectedType.toLowerCase());

    return matchesConcept && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner: Relational Synthesis Narrative */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase">
            Relational Conceptual Synthesis
          </h3>
        </div>

        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans mb-4">
          {summary.relationalSynthesis}
        </p>

        <div className="pt-4 border-t border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Executive Summary Overview
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {summary.executiveSummary}
          </p>
        </div>
      </div>

      {/* Visual Interactive Concept Network Map */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Visual Concept Topology & Interconnectivity
            </h4>
          </div>
          {activeFocus && (
            <button
              onClick={() => {
                setSelectedNode(null);
                if (onClearFilter) onClearFilter();
              }}
              className="text-xs text-indigo-400 hover:text-white font-medium"
            >
              Reset Network Focus
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Click any concept node to isolate its incoming and outgoing dependencies:
        </p>

        {/* Node Chips Flow */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {uniqueConcepts.map((concept) => {
            const isFocused = activeFocus && concept.toLowerCase().includes(activeFocus.toLowerCase());
            const connectionCount = summary.conceptRelationships.filter(
              (r) => r.sourceConceptTitle === concept || r.targetConceptTitle === concept
            ).length;

            return (
              <button
                key={concept}
                onClick={() => {
                  if (activeFocus === concept) {
                    setSelectedNode(null);
                    if (onClearFilter) onClearFilter();
                  } else {
                    setSelectedNode(concept);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isFocused
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{concept}</span>
                <span className="h-4 px-1.5 rounded-full text-[10px] bg-slate-800 text-slate-300 flex items-center justify-center font-mono">
                  {connectionCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Causal Logic Chains if available */}
      {summary.causalChains && summary.causalChains.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Causal Pathways & Logic Flows
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {summary.causalChains.map((chain, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-3"
              >
                <div className="h-5 w-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="leading-relaxed font-mono text-xs text-cyan-200">
                  {chain}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concept Relationships Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Inter-Concept Structural Links</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredRelationships.length} Links
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact directional relationships explaining how ideas enable, conflict with, or depend on each other.
            </p>
          </div>

          {/* Active Filter Indicator */}
          {activeFocus && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
              <span>Focused: <strong>{activeFocus}</strong></span>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  if (onClearFilter) onClearFilter();
                }}
                className="ml-1 text-slate-400 hover:text-white font-bold"
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Filter by Relationship Type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Relation Type:
          </span>
          {['all', 'enables', 'depends', 'conflicts', 'reinforces'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-slate-200 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type === 'all' ? 'All Relations' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Relationship Cards */}
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRelationships.map((rel, index) => {
            const badgeInfo = getRelationshipBadge(rel.relationshipType);
            const Icon = badgeInfo.icon;

            return (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Node Link Graphic */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={() => setSelectedNode(rel.sourceConceptTitle)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:text-indigo-300 transition-colors shadow-xs"
                  >
                    {rel.sourceConceptTitle}
                  </button>

                  <div className="flex items-center gap-1">
                    <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeInfo.badge}`}>
                      <Icon className="w-3 h-3" />
                      <span>{badgeInfo.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  <button
                    onClick={() => setSelectedNode(rel.targetConceptTitle)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:text-indigo-300 transition-colors shadow-xs"
                  >
                    {rel.targetConceptTitle}
                  </button>
                </div>

                {/* Narrative Explanation */}
                <div className="md:max-w-md lg:max-w-lg text-xs sm:text-sm text-slate-300 leading-relaxed border-t md:border-t-0 md:border-l border-slate-800/80 pt-2 md:pt-0 md:pl-4">
                  {rel.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
