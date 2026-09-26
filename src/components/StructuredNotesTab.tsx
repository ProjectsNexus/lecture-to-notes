import React, { useState } from 'react';
import { StructuredNotes } from '../types';
import { 
  CheckCircle2, 
  BookMarked, 
  Terminal, 
  ListChecks, 
  Search, 
  Copy, 
  Check, 
  Tag, 
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Globe
} from 'lucide-react';

interface StructuredNotesTabProps {
  notes: StructuredNotes;
}

export const StructuredNotesTab: React.FC<StructuredNotesTabProps> = ({ notes }) => {
  const [activeSection, setActiveSection] = useState<'all' | 'takeaways' | 'definitions' | 'jargon' | 'actions'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getImpactBadge = (impact: string) => {
    const norm = impact.toLowerCase();
    if (norm.includes('high')) {
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
    if (norm.includes('strat')) {
      return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700/60';
  };

  // Filtered lists
  const filteredTakeaways = notes.keyTakeaways.filter(
    (t) =>
      t.takeaway.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDefinitions = notes.definitions.filter(
    (d) =>
      d.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.formalDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.appliedContext.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJargon = notes.technicalJargon.filter(
    (j) =>
      j.jargon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.standardMeaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.practicalImplication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Structured Notes & Technical Glossary</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Categorized takeaways, formal terminology definitions, and technical jargon analyzed from the transcript.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search takeaways, definitions, jargon..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sub-Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSection === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Sections
        </button>
        <button
          onClick={() => setActiveSection('takeaways')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSection === 'takeaways'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Key Takeaways ({notes.keyTakeaways.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('definitions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSection === 'definitions'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Definitions ({notes.definitions.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('jargon')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeSection === 'jargon'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Technical Jargon ({notes.technicalJargon.length})</span>
        </button>
        {notes.decisionsAndNextSteps && notes.decisionsAndNextSteps.length > 0 && (
          <button
            onClick={() => setActiveSection('actions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'actions'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Decisions & Next Steps ({notes.decisionsAndNextSteps.length})</span>
          </button>
        )}
      </div>

      {/* 1. KEY TAKEAWAYS */}
      {(activeSection === 'all' || activeSection === 'takeaways') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                1. Core Key Takeaways
              </h4>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  notes.keyTakeaways.map((t) => `• [${t.impactLevel}] ${t.takeaway}`).join('\n'),
                  'takeaways'
                )
              }
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copiedSection === 'takeaways' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy List</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start gap-3.5"
              >
                <div className="mt-1 h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-mono">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {takeaway.category}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getImpactBadge(takeaway.impactLevel)}`}>
                      {takeaway.impactLevel} Impact
                    </span>
                    {takeaway.speakerAttribution && (
                      <span className="text-[11px] text-slate-400">
                        Speaker: <strong className="text-slate-300">{takeaway.speakerAttribution}</strong>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {takeaway.takeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. FORMAL DEFINITIONS */}
      {(activeSection === 'all' || activeSection === 'definitions') && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-violet-400" />
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                2. Concept Definitions
              </h4>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  notes.definitions.map((d) => `**${d.term}**: ${d.formalDefinition}`).join('\n\n'),
                  'definitions'
                )
              }
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copiedSection === 'definitions' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Definitions</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDefinitions.map((def, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-violet-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{def.term}</span>
                    </h5>
                    {def.originalLanguage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {def.originalLanguage}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                    {def.formalDefinition}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 font-semibold block mb-0.5">Applied Discussion Context:</span>
                  <span className="text-slate-400 italic">{def.appliedContext}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. TECHNICAL JARGON & ACRONYM GLOSSARY */}
      {(activeSection === 'all' || activeSection === 'jargon') && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                3. Technical Jargon & Acronym Glossary
              </h4>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  notes.technicalJargon
                    .map((j) => `**${j.jargon}** [${j.domain}]: ${j.standardMeaning} (Practical: ${j.practicalImplication})`)
                    .join('\n\n'),
                  'jargon'
                )
              }
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copiedSection === 'jargon' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Jargon</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredJargon.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
                      {item.jargon}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                      {item.domain}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Standard Meaning:</span>
                    <p className="text-slate-300 leading-relaxed">{item.standardMeaning}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold block mb-1">Practical Implication in Meeting:</span>
                    <p className="text-slate-300 leading-relaxed">{item.practicalImplication}</p>
                  </div>
                </div>

                {item.occurrenceQuote && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/70 text-xs text-slate-400 italic">
                    Example citation: "{item.occurrenceQuote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DECISIONS & NEXT STEPS */}
      {(activeSection === 'all' || activeSection === 'actions') && notes.decisionsAndNextSteps && notes.decisionsAndNextSteps.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-400" />
              <h4 className="text-base font-bold text-white uppercase tracking-wider">
                4. Action Items & Decisions
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {notes.decisionsAndNextSteps.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-4 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 font-medium">{action.decisionOrAction}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {action.owner && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                      Owner: {action.owner}
                    </span>
                  )}
                  {action.status && (
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {action.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
