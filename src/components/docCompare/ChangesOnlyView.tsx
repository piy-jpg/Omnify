import React from 'react';
import {
  DiffChangeItem,
  ChangeType
} from '../../types/docCompare';
import { PlusCircle, MinusCircle, AlertCircle, ArrowRight, Layers } from 'lucide-react';

interface ChangesOnlyViewProps {
  changes: DiffChangeItem[];
  activeFilter: ChangeType | 'all';
  searchQuery: string;
  currentChangeId?: string;
  onSelectChange?: (change: DiffChangeItem) => void;
}

export const ChangesOnlyView: React.FC<ChangesOnlyViewProps> = ({
  changes,
  activeFilter,
  searchQuery,
  currentChangeId,
  onSelectChange
}) => {
  const meaningful = changes.filter(c => c.type !== 'unchanged');
  const filtered = meaningful.filter(c => {
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

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">No differences found under this filter</h4>
        <p className="text-xs text-slate-500">Try switching to "All Changes" tab to view all modifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((ch, idx) => {
        const isSelected = ch.id === currentChangeId;
        const isModified = ch.type === 'modified';
        const isRemoved = ch.type === 'removed';
        const isAdded = ch.type === 'added';

        return (
          <div
            key={ch.id}
            onClick={() => onSelectChange?.(ch)}
            className={`p-5 rounded-3xl border bg-white dark:bg-slate-900 shadow-sm transition-all cursor-pointer space-y-3 ${
              isSelected ? 'ring-2 ring-brand-500 border-brand-500 shadow-md' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdded ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Added Content
                  </span>
                ) : isRemoved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <MinusCircle className="w-3.5 h-3.5" />
                    Removed Content
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Modified Content
                  </span>
                )}

                {ch.semanticCategory && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ch.semanticCategory}
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Item #{idx + 1} &bull; {ch.location.section || 'General'} (Line {ch.location.line || 1})
              </span>
            </div>

            {/* Content Delta Comparison */}
            {isModified ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block font-sans">Previous Version</span>
                  <div className="break-words line-through">{highlightSearch(ch.originalText)}</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block font-sans">New Version</span>
                  <div className="break-words font-semibold">{highlightSearch(ch.updatedText)}</div>
                </div>
              </div>
            ) : isRemoved ? (
              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 text-xs font-mono">
                <div className="break-words line-through">{highlightSearch(ch.originalText)}</div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-mono">
                <div className="break-words font-semibold">{highlightSearch(ch.updatedText)}</div>
              </div>
            )}

            {ch.semanticImpact && (
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 px-3 rounded-xl flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
                <span>Impact: <strong>{ch.semanticImpact}</strong></span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
