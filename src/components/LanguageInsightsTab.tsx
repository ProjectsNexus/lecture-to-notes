import React from 'react';
import { LanguageInsights, ContextDependentConcept } from '../types';
import { 
  Globe2, 
  Languages, 
  ArrowLeftRight, 
  AlertCircle, 
  Sparkles, 
  Compass, 
  Lightbulb,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface LanguageInsightsTabProps {
  insights: LanguageInsights;
}

export const LanguageInsightsTab: React.FC<LanguageInsightsTabProps> = ({ insights }) => {
  return (
    <div className="space-y-8">
      {/* Linguistic Overview Narrative */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-violet-500/30 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide uppercase">
            Multilingual & Cross-Cultural Dynamic Assessment
          </h3>
        </div>

        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
          {insights.overview}
        </p>
      </div>

      {/* Context-Dependent Concepts (Core deliverable) */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Context-Dependent & Untranslatable Concepts</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {insights.contextDependentConcepts.length} Nuances Analyzed
              </span>
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Concepts anchored in cultural, legal, or social systems where direct word-for-word translation creates serious misunderstandings or strips away crucial operational nuance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {insights.contextDependentConcepts.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 transition-all shadow-md space-y-4"
            >
              {/* Card Title & Language Tag */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <h5 className="text-xl font-extrabold text-white tracking-tight">
                    {item.term}
                  </h5>
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {item.language}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Literal Translation:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-xs">
                    "{item.literalTranslation}"
                  </span>
                </div>
              </div>

              {/* Contrast Matrix: Literal vs Contextual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> Contextual Meaning in Discussion
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {item.contextualMeaning}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Cultural & Institutional Nuance
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {item.culturalNuance}
                  </p>
                </div>
              </div>

              {/* Why Direct Translation Fails */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block mb-1">
                      Why Direct Literal Translation Fails:
                    </span>
                    <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                      {item.whyDirectTranslationFails}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategic Impact if provided */}
              {item.strategicImpactOnDiscussion && (
                <div className="pt-2 text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Impact on Discussion Outcomes: </strong>
                    <span className="text-slate-300">{item.strategicImpactOnDiscussion}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Code-Switching Dynamics */}
      {insights.codeSwitchingDynamics && insights.codeSwitchingDynamics.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="pb-3 border-b border-slate-800">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Code-Switching Events & Pragmatic Shifts</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Analysis of points in the dialogue where participants shifted languages, revealing underlying psychological comfort, precision needs, or cultural alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.codeSwitchingDynamics.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded">
                      Speaker: {item.speaker}
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      Shift #{idx + 1}
                    </span>
                  </div>

                  <h5 className="text-sm font-semibold text-slate-200 mb-2">
                    {item.shiftDescription}
                  </h5>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    <strong className="text-slate-300">Context:</strong> {item.triggerContext}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-cyan-400 font-semibold block mb-0.5">Pragmatic Reason:</span>
                  <span className="text-slate-300">{item.pragmaticReason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Cultural Recommendations */}
      {insights.crossCulturalRecommendations && insights.crossCulturalRecommendations.length > 0 && (
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Cross-Cultural Communication Recommendations
            </h4>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {insights.crossCulturalRecommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
