import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Archive,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileImage,
  Film,
  Presentation,
  Sliders,
  RefreshCw,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  QueueItem,
  CompressionOptions,
  BatchSummary,
  SmartRecommendation
} from '../types/compression';
import { CompressionService } from '../services/compression/compressionService';
import { analyzeFileClient, detectFormatClient } from '../services/compression/fileAnalyzer';
import { CompressionSettingsPanel } from '../components/compression/CompressionSettingsPanel';
import { CompressionQueue } from '../components/compression/CompressionQueue';
import { VisualComparisonModal } from '../components/compression/VisualComparisonModal';
import { BatchSummaryReport } from '../components/compression/BatchSummaryReport';
import { SmartRecommendations } from '../components/compression/SmartRecommendations';
import { formatBytes } from '../utils/formatters';

interface SmartCompressorPageProps {
  onFileConverted?: (fileItem: any) => void;
}

export const SmartCompressorPage: React.FC<SmartCompressorPageProps> = ({
  onFileConverted
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activeComparisonItem, setActiveComparisonItem] = useState<QueueItem | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCompressedOptions, setLastCompressedOptions] = useState<CompressionOptions | null>(null);

  // Global default compression options
  const [globalOptions, setGlobalOptions] = useState<CompressionOptions>({
    preset: 'balanced',
    quality: 78,
    targetSizeBytes: null,
    resolution: 'original',
    audioMode: 'preserve',
    resizeScale: 'original'
  });

  const areSettingsChanged = Boolean(
    queue.length > 0 &&
    lastCompressedOptions !== null &&
    (
      globalOptions.preset !== lastCompressedOptions.preset ||
      globalOptions.quality !== lastCompressedOptions.quality ||
      globalOptions.targetSizeBytes !== lastCompressedOptions.targetSizeBytes ||
      globalOptions.resolution !== lastCompressedOptions.resolution ||
      globalOptions.audioMode !== lastCompressedOptions.audioMode ||
      globalOptions.resizeScale !== lastCompressedOptions.resizeScale
    )
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze files when added to queue
  const handleFilesAdded = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setBatchSummary(null);

    const newItems: QueueItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { ext, category, format } = detectFormatClient(file);
      const id = `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      newItems.push({
        id,
        file,
        name: file.name,
        format,
        category,
        originalSize: file.size,
        status: 'analyzing',
        progress: 10,
        stageMessage: 'Analyzing structure...',
        options: { ...globalOptions }
      });
    }

    setQueue(prev => [...prev, ...newItems]);

    // Perform async analysis on newly added items
    for (const item of newItems) {
      try {
        const analysis = await analyzeFileClient(item.file);
        setQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? { ...q, status: 'waiting', progress: 0, stageMessage: '', analysis }
              : q
          )
        );
      } catch {
        setQueue(prev =>
          prev.map(q =>
            q.id === item.id ? { ...q, status: 'waiting', progress: 0 } : q
          )
        );
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Remove single item from queue
  const handleRemoveItem = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  // Apply recommendation
  const handleApplyRecommendation = (suggested: Partial<CompressionOptions>) => {
    const updated = { ...globalOptions, ...suggested };
    setGlobalOptions(updated);
    setQueue(prev => prev.map(q => ({ ...q, options: { ...q.options, ...suggested } })));
  };

  // Apply global options to all items in queue
  const handleApplyOptionsToAll = () => {
    setQueue(prev => prev.map(q => ({ ...q, options: { ...globalOptions } })));
  };

  const handleGlobalOptionsChange = (newOptions: CompressionOptions) => {
    setGlobalOptions(newOptions);
    setQueue(prev => prev.map(q => ({ ...q, options: { ...newOptions } })));
  };

  // Compress a single item
  const processSingleItem = async (item: QueueItem): Promise<QueueItem> => {
    setQueue(prev =>
      prev.map(q =>
        q.id === item.id
          ? { ...q, options: item.options || globalOptions, status: 'compressing', progress: 20, stageMessage: 'Executing compression...' }
          : q
      )
    );

    try {
      const res = await CompressionService.compress(item, (pct, msg) => {
        setQueue(prev =>
          prev.map(q =>
            q.id === item.id ? { ...q, progress: pct, stageMessage: msg } : q
          )
        );
      });

      if (!res.success) {
        throw new Error(res.error || 'Compression failed.');
      }

      const updatedItem: QueueItem = {
        ...item,
        status: 'complete',
        progress: 100,
        stageMessage: 'Completed',
        compressedSize: res.compressedSize,
        savedBytes: res.savedBytes,
        reductionPercentage: res.reductionPercentage,
        becameLarger: res.becameLarger,
        downloadUrl: res.downloadUrl,
        resultBlob: res.blob,
        jobId: res.jobId
      };

      setQueue(prev => prev.map(q => (q.id === item.id ? updatedItem : q)));

      // Notify ConvertPro global system
      onFileConverted?.({
        id: `comp-file-${Date.now()}-${item.id}`,
        name: res.downloadName || `${item.name.replace(/\.[^/.]+$/, '')}_compressed.${item.format.toLowerCase()}`,
        size: res.compressedSize,
        type: item.file.type || 'application/octet-stream',
        extension: item.format,
        uploadedAt: 'Just now',
        status: 'ready' as const,
        originalSize: item.originalSize,
        convertedSize: res.compressedSize
      });

      return updatedItem;
    } catch (err: any) {
      const failedItem: QueueItem = {
        ...item,
        status: 'failed',
        progress: 0,
        error: err.message || 'Compression failed.'
      };
      setQueue(prev => prev.map(q => (q.id === item.id ? failedItem : q)));
      return failedItem;
    }
  };

  // Trigger compression for all waiting/failed items in queue or regenerate with new settings
  const handleCompressAll = async () => {
    let pending = queue.filter(q => q.status === 'waiting' || q.status === 'failed');
    if (pending.length === 0 && (areSettingsChanged || queue.length > 0)) {
      pending = queue;
    }
    if (pending.length === 0) return;

    setIsProcessingAll(true);
    setErrorMessage(null);
    setBatchSummary(null);
    setLastCompressedOptions({ ...globalOptions });

    const preparedItems = pending.map(item => ({
      ...item,
      options: { ...globalOptions }
    }));

    const updatedResults: QueueItem[] = [];

    // Process concurrently with maximum 3 concurrent jobs
    const concurrency = 3;
    for (let i = 0; i < preparedItems.length; i += concurrency) {
      const chunk = preparedItems.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map(item => processSingleItem(item)));
      updatedResults.push(...chunkResults);
    }

    setIsProcessingAll(false);

    // Compute batch summary directly from newly updated results and existing queue
    setQueue(prev => {
      const merged = prev.map(q => {
        const freshlyDone = updatedResults.find(r => r.id === q.id);
        return freshlyDone || q;
      });

      const allCompleted = merged.filter(q => q.status === 'complete');
      if (allCompleted.length > 0) {
        const totalOrig = allCompleted.reduce((sum, q) => sum + q.originalSize, 0);
        const totalComp = allCompleted.reduce((sum, q) => sum + (q.compressedSize !== undefined ? q.compressedSize : q.originalSize), 0);
        const totalSaved = Math.max(0, totalOrig - totalComp);
        const overallRed = totalOrig > 0 ? Number(((totalSaved / totalOrig) * 100).toFixed(1)) : 0;

        setBatchSummary({
          totalFiles: merged.length,
          completedFiles: allCompleted.length,
          failedFiles: merged.filter(q => q.status === 'failed').length,
          totalOriginalBytes: totalOrig,
          totalCompressedBytes: totalComp,
          totalSavedBytes: totalSaved,
          overallReductionPercentage: overallRed
        });

        if (totalSaved > 0) {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 } });
        }
      }

      return merged;
    });
  };

  // Download single item
  const handleDownloadItem = (item: QueueItem) => {
    if (item.resultBlob) {
      CompressionService.triggerDownload(
        item.resultBlob,
        `${item.name.replace(/\.[^/.]+$/, '')}_compressed.${item.format.toLowerCase()}`
      );
    } else if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    }
  };

  // Download all batch items as ZIP
  const handleDownloadAllZip = async () => {
    const completed = queue.filter(q => q.status === 'complete');
    if (completed.length > 0) {
      await CompressionService.downloadBatchZip(completed);
    }
  };

  // Aggregate recommendations from all queue items
  const allRecommendations: SmartRecommendation[] = queue
    .map(q => q.analysis?.recommendations || [])
    .flat()
    .filter((rec, idx, self) => self.findIndex(r => r.title === rec.title) === idx);

  const hasVideoInQueue = queue.some(q => q.category === 'video');
  const hasImageInQueue = queue.some(q => q.category === 'image');
  const pendingCount = queue.filter(q => q.status === 'waiting' || q.status === 'failed').length;
  const completedCount = queue.filter(q => q.status === 'complete').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-brand-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>High-Fidelity Smart Compression Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Smart File Compressor
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
            Reduce file size without unnecessary quality loss. Genuine byte-level stream optimization for PDF, Images, DOCX, PPTX, Video, and ZIP.
          </p>
        </div>

        {/* Quick format tags */}
        <div className="flex flex-wrap gap-1.5 z-10 max-w-sm">
          {['PDF', 'JPG', 'PNG', 'WEBP', 'DOCX', 'PPTX', 'MP4', 'MOV', 'ZIP'].map((fmt) => (
            <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-[10px] font-mono font-bold text-white">
              {fmt}
            </span>
          ))}
        </div>

        {/* Background ambient orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error banner if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 space-y-4 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 hover:bg-slate-50/50 dark:hover:bg-slate-850'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi,.zip,video/*,image/*,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Upload className="w-8 h-8 animate-bounce-subtle" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Drop files here or click to browse
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Supported: PDF • JPG • PNG • WEBP • DOCX • PPTX • MP4 • MOV • WEBM • ZIP
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Maximum file size: 500 MB per file &bull; Multiple files supported
          </p>
        </div>
      </div>

      {/* 3. Smart Recommendations if any detected */}
      {allRecommendations.length > 0 && (
        <SmartRecommendations
          recommendations={allRecommendations}
          onApplyRecommendation={handleApplyRecommendation}
        />
      )}

      {/* 4. Settings Panel */}
      {queue.length > 0 && (
        <CompressionSettingsPanel
          options={globalOptions}
          onChange={handleGlobalOptionsChange}
          items={queue}
          totalOriginalBytes={queue.reduce((acc, q) => acc + q.originalSize, 0)}
          hasVideo={hasVideoInQueue}
          hasImage={hasImageInQueue}
          fileCount={queue.length}
          onApplyToAll={handleApplyOptionsToAll}
        />
      )}

      {/* 5. Primary Action Trigger (Compress Now / Regenerate) */}
      {queue.length > 0 && (pendingCount > 0 || areSettingsChanged) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="space-y-0.5">
            <span className="text-sm font-extrabold flex items-center gap-2">
              {areSettingsChanged ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-amber-300">Settings Changed — Ready to Regenerate</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Ready to compress {pendingCount} {pendingCount === 1 ? 'file' : 'files'}</span>
                </>
              )}
            </span>
            <p className="text-xs text-slate-400">
              Preset: <span className="capitalize text-slate-200 font-bold">{globalOptions.preset}</span> • Quality: <span className="text-slate-200 font-bold">{globalOptions.quality}%</span>
              {areSettingsChanged && (
                <span className="ml-2 text-amber-400/90 font-semibold">• Click regenerate to apply new settings</span>
              )}
            </p>
          </div>

          <button
            onClick={handleCompressAll}
            disabled={isProcessingAll}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              areSettingsChanged
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 shadow-orange-500/25'
                : 'bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 shadow-brand-500/25'
            }`}
          >
            {isProcessingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{areSettingsChanged ? 'Regenerating Compression...' : 'Compressing Files...'}</span>
              </>
            ) : areSettingsChanged ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Compression ({queue.length})</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Compression ({pendingCount})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 6. Batch Summary Report (When Batch is Finished) */}
      {batchSummary && (
        <BatchSummaryReport
          summary={batchSummary}
          items={queue.filter(q => q.status === 'complete')}
          onDownloadAllZip={handleDownloadAllZip}
          onDownloadSingle={handleDownloadItem}
          onReset={() => {
            setQueue([]);
            setBatchSummary(null);
            setLastCompressedOptions(null);
          }}
        />
      )}

      {/* 7. File Queue */}
      <CompressionQueue
        items={queue}
        onRemoveItem={handleRemoveItem}
        onDownloadItem={handleDownloadItem}
        onRetryItem={(id) => {
          const item = queue.find(q => q.id === id);
          if (item) processSingleItem(item);
        }}
        onOpenComparison={(item) => setActiveComparisonItem(item)}
      />

      {/* 8. Visual Comparison Modal */}
      <VisualComparisonModal
        isOpen={Boolean(activeComparisonItem)}
        onClose={() => setActiveComparisonItem(null)}
        item={activeComparisonItem}
        onDownload={handleDownloadItem}
      />

    </div>
  );
};
