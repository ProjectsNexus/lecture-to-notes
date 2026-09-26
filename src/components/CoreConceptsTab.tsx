import React, { useState } from 'react';
import { CoreConcept } from '../types';
import { 
  Sparkles, 
  Search, 
  Quote, 
  Users, 
  Tag, 
  ArrowRight,
  TrendingUp,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface CoreConceptsTabProps {
  concepts: CoreConcept[];
  onSelectConceptToExplore?: (conceptTitle: string) => void;
}

export const CoreConceptsTab: React.FC<CoreConceptsTabProps> = ({
  concepts,
  onSelectConceptToExplore,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['all', ...Array.from(new Set(concepts.map((c) => c.category)))];

  const filteredConcepts = concepts.filter((concept) => {
    const matchesCategory = selectedCategory === 'all' || concept.category === selectedCategory;
    const matchesSearch =
      concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.speakersInvolved?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header & Directive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Primary Topics & Core Concepts</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {concepts.length} Identified
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Exhaustive breakdown of central thematic pillars, technical subjects, and cultural-strategic topics extracted from the dialogue.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or speakers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Concepts Grid */}
      {filteredConcepts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
          <p className="text-sm text-slate-400">No concepts matched your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConcepts.map((concept, index) => {
            const scoreColor =
              concept.relevanceScore >= 90
                ? 'from-emerald-500 to-teal-400 text-emerald-300'
                : concept.relevanceScore >= 75
                ? 'from-indigo-500 to-cyan-400 text-indigo-300'
                : 'from-violet-500 to-purple-400 text-violet-300';

            return (
              <div
                key={concept.id || index}
                className="group p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Relevance & Category */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {concept.category}
                    </span>

                    <div className="flex items-center gap-1.5" title={`Relevance: ${concept.relevanceScore}/100`}>
                      <span className="text-[11px] font-mono font-bold text-slate-300">
                        {concept.relevanceScore}
                      </span>
                      <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${scoreColor}`}
                          style={{ width: `${concept.relevanceScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {concept.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {concept.description}
                  </p>

                  {/* Key Quotes if present */}
                  {concept.keyQuotes && concept.keyQuotes.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">
                          "{concept.keyQuotes[0]}"
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Speakers & Connection Link */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  {concept.speakersInvolved && concept.speakersInvolved.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">
                        {concept.speakersInvolved.join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Cross-discussion topic</span>
                  )}

                  {onSelectConceptToExplore && (
                    <button
                      onClick={() => onSelectConceptToExplore(concept.title)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Explore Links</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
