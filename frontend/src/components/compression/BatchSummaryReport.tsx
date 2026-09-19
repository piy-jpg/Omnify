import React from 'react';
import {
  CheckCircle2,
  Download,
  Archive,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  FileCheck2
} from 'lucide-react';
import { QueueItem, BatchSummary } from '../../types/compression';
import { formatBytes } from '../../utils/formatters';

interface BatchSummaryReportProps {
  summary: BatchSummary;
  items: QueueItem[];
  onDownloadAllZip: () => void;
  onDownloadSingle: (item: QueueItem) => void;
  onReset: () => void;
}

export const BatchSummaryReport: React.FC<BatchSummaryReportProps> = ({
  summary,
  items,
  onDownloadAllZip,
  onDownloadSingle,
  onReset
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Compression Complete ✓
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {summary.completedFiles} of {summary.totalFiles} files
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-fidelity compression applied with zero structural or layout loss
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Batch</span>
          </button>

          <button
            onClick={onDownloadAllZip}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Archive className="w-4 h-4" />
            <span>Download All (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Original Total
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatBytes(summary.totalOriginalBytes)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Compressed Total
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatBytes(summary.totalCompressedBytes)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Total Space Saved
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
            {formatBytes(summary.totalSavedBytes)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Overall Reduction
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            {summary.overallReductionPercentage}%
          </span>
        </div>
      </div>

      {/* ── PROMINENT DOWNLOAD ALL CTA ─────────────────────────────────── */}
      {items.length > 1 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-extrabold text-base flex items-center gap-2">
                <Archive className="w-5 h-5 text-white/80" />
                Download All Compressed Files
              </p>
              <p className="text-xs text-emerald-100/80">
                {items.length} files bundled into a single ZIP — {formatBytes(summary.totalCompressedBytes)} total
              </p>
            </div>
            <button
              onClick={onDownloadAllZip}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-white text-emerald-700 font-extrabold text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-lg shadow-black/10 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download ZIP ({items.length} files)
            </button>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 grid grid-cols-12 gap-2">
          <span className="col-span-5 sm:col-span-6">File Name</span>
          <span className="col-span-3 sm:col-span-2 text-right">Original</span>
          <span className="col-span-2 sm:col-span-2 text-right">Compressed</span>
          <span className="col-span-2 text-right">Action</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="p-3.5 grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="col-span-5 sm:col-span-6 flex items-center gap-2 min-w-0">
                <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-extrabold text-slate-900 dark:text-white truncate">
                  {item.name}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-500 uppercase">
                  {item.format}
                </span>
              </div>

              <div className="col-span-3 sm:col-span-2 text-right text-slate-500 dark:text-slate-400 font-mono">
                {formatBytes(item.originalSize)}
              </div>

              <div className="col-span-2 sm:col-span-2 text-right font-mono">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.compressedSize ? formatBytes(item.compressedSize) : '-'}
                </span>
                {item.reductionPercentage !== undefined && item.reductionPercentage > 0 && (
                  <span className="block text-[10px] text-emerald-500 font-bold">-{item.reductionPercentage}%</span>
                )}
              </div>

              <div className="col-span-2 text-right">
                <button
                  onClick={() => onDownloadSingle(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold transition-colors text-[11px]"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

