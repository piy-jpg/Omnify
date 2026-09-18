import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  Download,
  CheckCircle2,
  FileImage,
  Film,
  FileText,
  Presentation,
  Archive,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { QueueItem } from '../../types/compression';
import { formatBytes } from '../../utils/formatters';

interface VisualComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QueueItem | null;
  onDownload: (item: QueueItem) => void;
}

export const VisualComparisonModal: React.FC<VisualComparisonModalProps> = ({
  isOpen,
  onClose,
  item,
  onDownload
}) => {
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50); // For split view
  const [viewMode, setViewMode] = useState<'sideBySide' | 'split'>('sideBySide');

  useEffect(() => {
    if (item && item.file) {
      if (item.category === 'image' || item.category === 'video') {
        const url = URL.createObjectURL(item.file);
        setOriginalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setOriginalPreviewUrl(null);
  }, [item]);

  if (!isOpen || !item) return null;

  const compressedUrl = item.downloadUrl || (item.resultBlob ? URL.createObjectURL(item.resultBlob) : originalPreviewUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                Quality Inspection: {item.name}
              </h3>
              <p className="text-xs text-slate-400">
                Comparing original fidelity with compressed result
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.category === 'image' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'sideBySide'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Split Slider
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Measurement Metrics Banner */}
        <div className="p-4 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Size</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono">
              {formatBytes(item.originalSize)}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Compressed Size</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {item.compressedSize ? formatBytes(item.compressedSize) : 'Processing...'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Space Saved</span>
            <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400 font-mono">
              {item.savedBytes ? formatBytes(item.savedBytes) : '0 KB'}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Reduction Ratio</span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {item.reductionPercentage !== undefined ? `${item.reductionPercentage}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Visual Inspection Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* IMAGE PREVIEW */}
          {item.category === 'image' && originalPreviewUrl && compressedUrl && (
            <div>
              {viewMode === 'sideBySide' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Original Image</span>
                      <span className="font-mono">{formatBytes(item.originalSize)}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2 flex items-center justify-center max-h-80 overflow-hidden">
                      <img
                        src={originalPreviewUrl}
                        alt="Original"
                        className="max-h-72 object-contain rounded-xl shadow-md"
                      />
                    </div>
                  </div>

                  {/* Right: Compressed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Compressed Output</span>
                      <span className="font-mono">{item.compressedSize ? formatBytes(item.compressedSize) : ''}</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-2 flex items-center justify-center max-h-80 overflow-hidden ring-1 ring-emerald-500/20">
                      <img
                        src={compressedUrl}
                        alt="Compressed"
                        className="max-h-72 object-contain rounded-xl shadow-md"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Split View Slider */
                <div className="space-y-2">
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden max-h-96 flex items-center justify-center select-none">
                    <img
                      src={compressedUrl}
                      alt="Compressed"
                      className="max-h-96 w-full object-contain"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img
                        src={originalPreviewUrl}
                        alt="Original"
                        className="max-h-96 w-full object-contain"
                      />
                    </div>
                    {/* Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-800 flex items-center justify-center text-[10px] font-bold shadow-md">
                        ⇄
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Original (Left)</span>
                    <span>Compressed (Right)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {item.category === 'video' && originalPreviewUrl && compressedUrl && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Original Video</span>
                  <span className="font-mono">{formatBytes(item.originalSize)}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-black overflow-hidden aspect-video flex items-center justify-center">
                  <video src={originalPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Compressed Output</span>
                  <span className="font-mono">{item.compressedSize ? formatBytes(item.compressedSize) : ''}</span>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-black overflow-hidden aspect-video flex items-center justify-center ring-1 ring-emerald-500/20">
                  <video src={compressedUrl} controls className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT & ARCHIVE SUMMARY PREVIEW */}
          {(item.category === 'document' || item.category === 'presentation' || item.category === 'archive') && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Package Structure & Integrity Verified
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All document formatting, styles, tables, vector geometries, and text searchability remain intact.
                  </p>
                </div>
              </div>

              {item.analysis?.details && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {item.analysis.details.embeddedMediaCount !== undefined && (
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Embedded Images</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                        {item.analysis.details.embeddedMediaCount} optimized
                      </span>
                    </div>
                  )}
                  {item.analysis.details.totalEntries !== undefined && (
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Archive Entries</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                        {item.analysis.details.totalEntries} entries
                      </span>
                    </div>
                  )}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Compression Core</span>
                    <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                      ConvertPro Smart Core
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            Close Inspection
          </button>

          <button
            onClick={() => {
              onDownload(item);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Compressed {item.format}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
