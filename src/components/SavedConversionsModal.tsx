import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  Search, 
  Calendar, 
  Clock, 
  FileAudio, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Layers,
  Globe2
} from 'lucide-react';
import { SavedConversion, getSavedConversions, deleteConversion, formatTimeRemaining } from '../utils/conversionStorage';

interface SavedConversionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversion: (conversion: SavedConversion) => void;
  currentConversionId?: string | null;
}

export const SavedConversionsModal: React.FC<SavedConversionsModalProps> = ({
  isOpen,
  onClose,
  onSelectConversion,
  currentConversionId,
}) => {
  const [conversions, setConversions] = useState<SavedConversion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadConversions = async () => {
    setIsLoading(true);
    try {
      const list = await getSavedConversions();
      setConversions(list);
    } catch (err) {
      console.error('Failed to load saved conversions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversion(id);
    setConversions((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredConversions = conversions.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.languages.some((l) => l.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.transcript.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Saved Conversions
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {conversions.length} Stored
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Retained for 3 months (90 days), then automatically pruned • No login required</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Zero logins required. Conversions are stored in your device's persistent storage with a 90-day retention lifespan.
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past conversions by concept, language, or content..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              Loading saved conversions...
            </div>
          ) : filteredConversions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-400">
                {searchTerm ? 'No matching conversions found.' : 'No conversions stored yet.'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever you transcribe audio or convert a transcript, it will be automatically saved here for 3 months.
              </p>
            </div>
          ) : (
            filteredConversions.map((conv) => {
              const remaining = formatTimeRemaining(conv.expiresAt);
              const isCurrent = currentConversionId === conv.id;
              const dateStr = new Date(conv.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversion(conv);
                    onClose();
                  }}
                  className={`group p-4 sm:p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {conv.audioFileName ? (
                          <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Audio conversion">
                            <FileAudio className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-slate-800 text-slate-400 border border-slate-700" title="Text transcript conversion">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {conv.title}
                        </h4>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{dateStr}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{conv.conceptCount} Concepts</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe2 className="w-3 h-3 text-slate-500" />
                          <span>{conv.languages.join(', ') || 'Multilingual'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {/* 3-Month Expiry Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1 ${
                          remaining.isExpiringSoon
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                        title={`Created: ${new Date(conv.createdAt).toLocaleString()} | Auto-removes: ${new Date(conv.expiresAt).toLocaleString()}`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{remaining.text}</span>
                      </span>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                        title="Remove now"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Snippet from transcript or synthesis */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {conv.analysisResult.conceptualSummary?.executiveSummary || conv.transcript}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Auto-purges 3 months after creation
                    </span>
                    <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Restore & Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <span>Items older than 90 days are automatically cleared on startup.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
