import React from 'react';
import {
  FileText,
  FileImage,
  Film,
  Archive,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { QueueItem } from '../../types/compression';
import { formatBytes } from '../../utils/formatters';
import { estimateOutputSize } from '../../utils/compressionEstimator';

interface CompressionQueueProps {
  items: QueueItem[];
  onRemoveItem: (id: string) => void;
  onDownloadItem: (item: QueueItem) => void;
  onRetryItem: (id: string) => void;
  onOpenComparison: (item: QueueItem) => void;
  onOpenItemSettings?: (item: QueueItem) => void;
}

export const CompressionQueue: React.FC<CompressionQueueProps> = ({
  items,
  onRemoveItem,
  onDownloadItem,
  onRetryItem,
  onOpenComparison,
  onOpenItemSettings
}) => {
  if (items.length === 0) return null;

  const getFormatIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <FileImage className="w-5 h-5 text-rose-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-indigo-500" />;
      case 'presentation':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (item: QueueItem) => {
    switch (item.status) {
      case 'complete':
        if (item.becameLarger) {
          return (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Already Optimal
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>-{item.reductionPercentage}%</span>
          </span>
        );
      case 'compressing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 animate-pulse border border-brand-200 dark:border-brand-800">
            Compressing ({item.progress}%)
          </span>
        );
      case 'analyzing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Analyzing...
          </span>
        );
      case 'validating':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            Validating Output
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Waiting in Queue
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          File Queue ({items.length} {items.length === 1 ? 'file' : 'files'})
        </h4>
        <span className="text-[11px] text-slate-400">
          Total input: {formatBytes(items.reduce((acc, i) => acc + i.originalSize, 0))}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs flex flex-col gap-3 ${
              item.status === 'complete'
                ? 'border-emerald-200 dark:border-emerald-900/60'
                : item.status === 'failed'
                ? 'border-rose-200 dark:border-rose-900/60'
                : item.status === 'compressing'
                ? 'border-brand-400 dark:border-brand-700 ring-2 ring-brand-500/10'
                : 'border-slate-200/90 dark:border-slate-800'
            }`}
          >
            {/* Top row: Icon, Name, Format badge, Size & Status */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                  {getFormatIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h5>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 flex-shrink-0 uppercase">
                      {item.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="font-mono">{formatBytes(item.originalSize)}</span>
                    {/* Show actual result if complete */}
                    {item.compressedSize !== undefined && (
                      <>
                        <span>→</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatBytes(item.compressedSize)}
                        </span>
                        {item.savedBytes !== undefined && item.savedBytes > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                            -{item.reductionPercentage}%
                          </span>
                        )}
                      </>
                    )}
                    {/* Show live estimate for waiting items */}
                    {item.compressedSize === undefined && item.status === 'waiting' && (() => {
                      const est = estimateOutputSize([item], item.options);
                      if (est.reductionPercentage > 0) {
                        return (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">→</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">
                              ~{formatBytes(est.estimatedBytes)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] flex items-center gap-0.5">
                              <TrendingDown className="w-2.5 h-2.5" />
                              est. -{est.reductionPercentage}%
                            </span>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Status Badge & Action Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(item)}

                {item.status === 'complete' && (
                  <>
                    <button
                      onClick={() => onOpenComparison(item)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                      title="Inspect Quality & Before/After Comparison"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="Download Compressed File"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </>
                )}

                {item.status === 'failed' && (
                  <button
                    onClick={() => onRetryItem(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                )}

                {item.status !== 'compressing' && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar (Visible during processing) */}
            {(item.status === 'compressing' || item.status === 'analyzing' || item.status === 'validating') && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.stageMessage || 'Optimizing binary streams...'}</span>
                  <span className="font-mono font-bold">{item.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Notice if file was already optimal / became larger */}
            {item.becameLarger && item.status === 'complete' && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                💡 This file was already at optimal compression. The original high-fidelity file has been preserved to avoid unnecessary size increase.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
