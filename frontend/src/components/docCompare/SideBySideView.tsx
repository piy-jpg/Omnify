import React, { useRef, useEffect } from 'react';
import { DiffChangeItem, ChangeType } from '../../types/docCompare';

interface SideBySideViewProps {
  changes: DiffChangeItem[];
  fileAName: string;
  fileBName: string;
  activeFilter: ChangeType | 'all';
  searchQuery: string;
  currentChangeId?: string;
  onSelectChange?: (change: DiffChangeItem) => void;
}

export const SideBySideView: React.FC<SideBySideViewProps> = ({
  changes,
  fileAName,
  fileBName,
  activeFilter,
  searchQuery,
  currentChangeId,
  onSelectChange
}) => {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  // Synchronize scrolling between left and right panes
  const handleLeftScroll = () => {
    if (isSyncingLeft.current) return;
    isSyncingRight.current = true;
    if (rightPaneRef.current && leftPaneRef.current) {
      rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
    }
    setTimeout(() => { isSyncingRight.current = false; }, 50);
  };

  const handleRightScroll = () => {
    if (isSyncingRight.current) return;
    isSyncingLeft.current = true;
    if (leftPaneRef.current && rightPaneRef.current) {
      leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
    }
    setTimeout(() => { isSyncingLeft.current = false; }, 50);
  };

  // Scroll active change into view when currentChangeId updates
  useEffect(() => {
    if (currentChangeId) {
      const el = document.getElementById(`side-row-${currentChangeId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentChangeId]);

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
      {/* Panes Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300">
        <div className="p-3.5 px-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            ORIGINAL: <strong className="text-slate-900 dark:text-white truncate max-w-xs">{fileAName}</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Document A</span>
        </div>
        <div className="p-3.5 px-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            NEW VERSION: <strong className="text-slate-900 dark:text-white truncate max-w-xs">{fileBName}</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Document B</span>
        </div>
      </div>

      {/* Synchronized Side-by-Side Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 font-mono text-xs leading-relaxed max-h-[700px] overflow-y-auto">
        
        {/* LEFT COLUMN: ORIGINAL */}
        <div
          ref={leftPaneRef}
          onScroll={handleLeftScroll}
          className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 overflow-y-auto space-y-0.5"
        >
          {filteredChanges.map((ch, idx) => {
            const isSelected = ch.id === currentChangeId;
            const isModified = ch.type === 'modified';
            const isRemoved = ch.type === 'removed';
            const isAdded = ch.type === 'added';

            return (
              <div
                key={`left-${ch.id}`}
                id={`side-row-${ch.id}`}
                onClick={() => onSelectChange?.(ch)}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-brand-500 shadow-md'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                } ${
                  isRemoved
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500'
                    : isModified
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border-l-4 border-amber-500'
                    : isAdded
                    ? 'opacity-40 bg-slate-50 dark:bg-slate-900 text-slate-400 italic'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
                  <span>Line {ch.location.line || idx + 1} {ch.location.section && `&bull; ${ch.location.section}`}</span>
                  {isRemoved && <span className="text-rose-600 font-bold uppercase">Removed</span>}
                  {isModified && <span className="text-amber-600 font-bold uppercase">Modified</span>}
                </div>

                {isAdded ? (
                  <div className="text-[11px] text-slate-400 italic select-none py-1">
                    [Not present in Original Document]
                  </div>
                ) : isModified && ch.wordDiffs ? (
                  <div className="break-words">
                    {ch.wordDiffs
                      .filter(w => w.type !== 'added')
                      .map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className={
                            w.type === 'removed'
                              ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-bold line-through px-0.5 rounded'
                              : ''
                          }
                        >
                          {highlightSearch(w.value)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className="break-words whitespace-pre-wrap">
                    {highlightSearch(ch.originalText || '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: NEW VERSION */}
        <div
          ref={rightPaneRef}
          onScroll={handleRightScroll}
          className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 overflow-y-auto space-y-0.5"
        >
          {filteredChanges.map((ch, idx) => {
            const isSelected = ch.id === currentChangeId;
            const isModified = ch.type === 'modified';
            const isRemoved = ch.type === 'removed';
            const isAdded = ch.type === 'added';

            return (
              <div
                key={`right-${ch.id}`}
                onClick={() => onSelectChange?.(ch)}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-brand-500 shadow-md'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                } ${
                  isAdded
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-500'
                    : isModified
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border-l-4 border-amber-500'
                    : isRemoved
                    ? 'opacity-40 bg-slate-50 dark:bg-slate-900 text-slate-400 italic'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
                  <span>Line {ch.location.line || idx + 1} {ch.location.section && `&bull; ${ch.location.section}`}</span>
                  {isAdded && <span className="text-emerald-600 font-bold uppercase">Added</span>}
                  {isModified && <span className="text-amber-600 font-bold uppercase">Updated</span>}
                </div>

                {isRemoved ? (
                  <div className="text-[11px] text-slate-400 italic select-none py-1">
                    [Removed in New Version]
                  </div>
                ) : isModified && ch.wordDiffs ? (
                  <div className="break-words">
                    {ch.wordDiffs
                      .filter(w => w.type !== 'removed')
                      .map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className={
                            w.type === 'added'
                              ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold px-0.5 rounded'
                              : ''
                          }
                        >
                          {highlightSearch(w.value)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className="break-words whitespace-pre-wrap">
                    {highlightSearch(ch.updatedText || '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
