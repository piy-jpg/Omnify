import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  FileText,
  FileCode,
  Layers,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import {
  ComparisonStatistics,
  ComparisonSummary,
  SummaryStyle,
  ComparisonResult
} from '../../types/docCompare';
import { ExportReportService } from '../../services/docCompare/exportReportService';

interface SummaryAndStatsPanelProps {
  result: ComparisonResult;
  onStyleChange?: (style: SummaryStyle) => void;
}

export const SummaryAndStatsPanel: React.FC<SummaryAndStatsPanelProps> = ({
  result,
  onStyleChange
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const { statistics, summary, isIdentical } = result;

  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'md' | 'json') => {
    setIsExporting(true);
    setExportDropdownOpen(false);
    try {
      if (format === 'pdf') await ExportReportService.exportPdf(result);
      else if (format === 'docx') await ExportReportService.exportDocx(result);
      else if (format === 'md') ExportReportService.exportMarkdown(result);
      else if (format === 'json') ExportReportService.exportJson(result);
      else ExportReportService.exportTxt(result);
    } catch (e) {
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Comparison Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Changes */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Changes</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {statistics.totalChanges}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">detected in document</span>
        </div>

        {/* Added */}
        <div className="p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Added Items</span>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
            +{statistics.addedCount}
          </div>
          <span className="text-[10px] text-emerald-600/80 font-mono">+{statistics.wordsAdded} words</span>
        </div>

        {/* Removed */}
        <div className="p-4 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Removed Items</span>
          <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
            -{statistics.removedCount}
          </div>
          <span className="text-[10px] text-rose-600/80 font-mono">-{statistics.wordsRemoved} words</span>
        </div>

        {/* Modified */}
        <div className="p-4 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Modified Items</span>
          <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
            {statistics.modifiedCount}
          </div>
          <span className="text-[10px] text-amber-600/80 font-mono">altered sections</span>
        </div>

        {/* Unchanged */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unchanged</span>
          <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300">
            {statistics.unchangedCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">identical elements</span>
        </div>

        {/* Similarity Score */}
        <div className="p-4 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20 space-y-1">
          <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider block">Similarity</span>
          <div className="text-xl font-extrabold">
            {statistics.similarityScore}%
          </div>
          <span className="text-[10px] text-indigo-200 font-mono">
            {result.fileA.wordCount} &rarr; {result.fileB.wordCount} words
          </span>
        </div>

      </div>

      {/* 2. AI Change Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grounded AI Change Summary</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {isIdentical ? 'Exact Match Verification' : 'Verified Semantic Analysis'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Style Selector Chips */}
            {onStyleChange && (
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => onStyleChange('detailed')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    summary.style === 'detailed'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => onStyleChange('executive')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    summary.style === 'executive'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Executive
                </button>
                <button
                  onClick={() => onStyleChange('key_changes')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    summary.style === 'key_changes'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Bullets
                </button>
              </div>
            )}

            {/* Export Report Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating Report...' : 'Download Report'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-40 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
                  >
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>Audit Report (PDF)</span>
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    <span>Word Document (DOCX)</span>
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
                  >
                    <FileCode className="w-4 h-4 text-purple-500" />
                    <span>Markdown Report (.md)</span>
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
                  >
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    <span>Plain Text Changelog (.txt)</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
                  >
                    <FileCode className="w-4 h-4 text-amber-500" />
                    <span>Structured JSON Data (.json)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overview Narrative */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {summary.overviewText}
        </div>

        {/* Key Changes Numbered List */}
        {summary.keyChanges && summary.keyChanges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Key Changes ({summary.keyChanges.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.keyChanges.map((kc, i) => (
                <div
                  key={kc.id || i}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-[10px] font-mono flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {kc.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {kc.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {kc.description}
                  </p>

                  {(kc.originalValue || kc.updatedValue) && (
                    <div className="text-[11px] font-mono pt-1 space-y-1">
                      {kc.originalValue && (
                        <div className="text-rose-600 dark:text-rose-400 line-through truncate">
                          - {kc.originalValue}
                        </div>
                      )}
                      {kc.updatedValue && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                          + {kc.updatedValue}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
