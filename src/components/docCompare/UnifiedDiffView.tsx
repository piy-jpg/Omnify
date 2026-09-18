import React from 'react';
import { DiffChangeItem, ChangeType } from '../../types/docCompare';

interface UnifiedDiffViewProps {
  changes: DiffChangeItem[];
  activeFilter: ChangeType | 'all';
  searchQuery: string;
  currentChangeId?: string;
  onSelectChange?: (change: DiffChangeItem) => void;
}

export const UnifiedDiffView: React.FC<UnifiedDiffViewProps> = ({
  changes,
  activeFilter,
  searchQuery,
  currentChangeId,
  onSelectChange
}) => {
  const filteredChanges = changes.filter(c => {
    if (activeFilter === 'all') return true;
    return c.type === activeFilter;
  });

  const highlightSearch = (text: string) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-500/50 text-slate-900 dark:text-white px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
        <span>Unified Inline Comparison Stream</span>
        <span className="text-[11px] text-slate-400 font-mono">
          <span className="text-rose-600 font-bold">~~Red Strikethrough~~</span> = Removed &bull; <span className="text-emerald-600 font-bold">**Green Bold**</span> = Added
        </span>
      </div>

      <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs leading-relaxed max-h-[700px] overflow-y-auto space-y-1">
        {filteredChanges.map((ch, idx) => {
          const isSelected = ch.id === currentChangeId;
          const isModified = ch.type === 'modified';
          const isRemoved = ch.type === 'removed';
          const isAdded = ch.type === 'added';

          return (
            <div
              key={ch.id}
              onClick={() => onSelectChange?.(ch)}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-brand-500 bg-brand-50/20 shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-850'
              } ${
                isRemoved
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-l-4 border-rose-500'
                  : isAdded
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-emerald-500'
                  : isModified
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-amber-500'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
                <span>Line {ch.location.line || idx + 1} {ch.location.section && `&bull; ${ch.location.section}`}</span>
                {isAdded && <span className="text-emerald-600 font-bold">ADDED</span>}
                {isRemoved && <span className="text-rose-600 font-bold">REMOVED</span>}
                {isModified && <span className="text-amber-600 font-bold">MODIFIED</span>}
              </div>

              {isModified && ch.wordDiffs ? (
                <div className="break-words">
                  {ch.wordDiffs.map((w, wIdx) => {
                    if (w.type === 'removed') {
                      return (
                        <span key={wIdx} className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 line-through mx-0.5 px-1 py-0.5 rounded font-bold">
                          {highlightSearch(w.value)}
                        </span>
                      );
                    }
                    if (w.type === 'added') {
                      return (
                        <span key={wIdx} className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 mx-0.5 px-1 py-0.5 rounded font-bold">
                          {highlightSearch(w.value)}
                        </span>
                      );
                    }
                    return <span key={wIdx}>{highlightSearch(w.value)}</span>;
                  })}
                </div>
              ) : isRemoved ? (
                <div className="break-words line-through text-rose-700 dark:text-rose-300">
                  {highlightSearch(ch.originalText)}
                </div>
              ) : isAdded ? (
                <div className="break-words text-emerald-700 dark:text-emerald-300 font-semibold">
                  {highlightSearch(ch.updatedText)}
                </div>
              ) : (
                <div className="break-words whitespace-pre-wrap">
                  {highlightSearch(ch.originalText)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
