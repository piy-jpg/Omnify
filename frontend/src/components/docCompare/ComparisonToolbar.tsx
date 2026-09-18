import React from 'react';
import {
  Columns,
  AlignLeft,
  ListFilter,
  Eye,
  Search,
  ChevronUp,
  ChevronDown,
  FileCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ViewMode, ChangeType } from '../../types/docCompare';

interface ComparisonToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeFilter: ChangeType | 'all';
  onFilterChange: (filter: ChangeType | 'all') => void;
  currentChangeIndex: number;
  totalChanges: number;
  onNextChange: () => void;
  onPrevChange: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  movedCount: number;
  onNewComparison: () => void;
}

export const ComparisonToolbar: React.FC<ComparisonToolbarProps> = ({
  viewMode,
  onViewModeChange,
  activeFilter,
  onFilterChange,
  currentChangeIndex,
  totalChanges,
  onNextChange,
  onPrevChange,
  searchQuery,
  onSearchChange,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  addedCount,
  removedCount,
  modifiedCount,
  movedCount,
  onNewComparison
}) => {
  return (
    <div className="sticky top-16 z-30 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* 1. View Mode Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => onViewModeChange('side_by_side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'side_by_side'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => onViewModeChange('unified')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'unified'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Unified Diff</span>
          </button>

          <button
            onClick={() => onViewModeChange('changes_only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'changes_only'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Changes Only</span>
          </button>

          <button
            onClick={() => onViewModeChange('original_only')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'original_only'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Original
          </button>

          <button
            onClick={() => onViewModeChange('new_only')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'new_only'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Version
          </button>
        </div>

        {/* 2. Change Navigation Stepper */}
        {totalChanges > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Change <strong>{currentChangeIndex + 1}</strong> of <strong>{totalChanges}</strong></span>
            <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-2">
              <button
                onClick={onPrevChange}
                disabled={currentChangeIndex <= 0}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                title="Previous Change"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNextChange}
                disabled={currentChangeIndex >= totalChanges - 1}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                title="Next Change"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Search Bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs flex-1 max-w-xs min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          {searchQuery && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
              <span>{matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0 matches'}</span>
              {matchCount > 0 && (
                <>
                  <button onClick={onPrevMatch} className="p-0.5 hover:text-slate-700"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={onNextMatch} className="p-0.5 hover:text-slate-700"><ChevronDown className="w-3 h-3" /></button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4. New Comparison Button */}
        <button
          onClick={onNewComparison}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Batch</span>
        </button>

      </div>

      {/* 5. Change Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold text-[11px]">Filter:</span>
        <button
          onClick={() => onFilterChange('all')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All Changes ({totalChanges})
        </button>

        <button
          onClick={() => onFilterChange('added')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
            activeFilter === 'added'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Added ({addedCount})</span>
        </button>

        <button
          onClick={() => onFilterChange('removed')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
            activeFilter === 'removed'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Removed ({removedCount})</span>
        </button>

        <button
          onClick={() => onFilterChange('modified')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
            activeFilter === 'modified'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Modified ({modifiedCount})</span>
        </button>

        {movedCount > 0 && (
          <button
            onClick={() => onFilterChange('moved')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeFilter === 'moved'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Moved ({movedCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};
