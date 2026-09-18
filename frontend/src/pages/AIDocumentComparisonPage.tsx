import React, { useState, useEffect, useRef } from 'react';
import {
  GitCompare,
  Sparkles,
  Clock,
  Columns,
  AlignLeft,
  ListFilter,
  CheckCircle2,
  RefreshCw,
  Eye,
  AlertCircle,
  FileCheck2,
  Download,
  Layers,
  Search,
  ArrowLeftRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExtractedDocument,
  ComparisonResult,
  ComparisonMode,
  SummaryStyle,
  ViewMode,
  ChangeType,
  DiffChangeItem,
  RecentComparisonRecord
} from '../types/docCompare';
import { DocumentExtractor } from '../services/docCompare/documentExtractor';
import { AISummaryService } from '../services/docCompare/aiSummaryService';
import { CompareDropzone } from '../components/docCompare/CompareDropzone';
import { ComparisonToolbar } from '../components/docCompare/ComparisonToolbar';
import { SideBySideView } from '../components/docCompare/SideBySideView';
import { UnifiedDiffView } from '../components/docCompare/UnifiedDiffView';
import { ChangesOnlyView } from '../components/docCompare/ChangesOnlyView';
import { SummaryAndStatsPanel } from '../components/docCompare/SummaryAndStatsPanel';
import { RecentComparisonsModal } from '../components/docCompare/RecentComparisonsModal';

const STORAGE_KEY = 'convertpro_recent_comparisons';

export const AIDocumentComparisonPage: React.FC = () => {
  // Upload & Extraction State
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [extractedA, setExtractedA] = useState<ExtractedDocument | null>(null);
  const [extractedB, setExtractedB] = useState<ExtractedDocument | null>(null);
  const [isExtractingA, setIsExtractingA] = useState(false);
  const [isExtractingB, setIsExtractingB] = useState(false);

  // Comparison & Processing State
  const [isComparing, setIsComparing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('general');
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('detailed');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View & Interactive State
  const [viewMode, setViewMode] = useState<ViewMode>('side_by_side');
  const [activeFilter, setActiveFilter] = useState<ChangeType | 'all'>('all');
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Preview & History Modal State
  const [previewDoc, setPreviewDoc] = useState<ExtractedDocument | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recentRecords, setRecentRecords] = useState<RecentComparisonRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  const saveRecordToHistory = (res: ComparisonResult) => {
    const newRecord: RecentComparisonRecord = {
      id: res.comparisonId,
      title: `${res.fileA.name} vs ${res.fileB.name}`,
      fileAName: res.fileA.name,
      fileBName: res.fileB.name,
      fileASize: res.fileA.size,
      fileBSize: res.fileB.size,
      fileAFormat: res.fileA.format,
      fileBFormat: res.fileB.format,
      changeCount: res.statistics.totalChanges,
      mode: res.mode,
      comparedAt: new Date(res.createdAt).toLocaleString(),
      timestamp: res.createdAt,
      statistics: res.statistics,
      summaryOverview: res.summary.overviewText,
      result: res
    };

    setRecentRecords(prev => {
      const updated = [newRecord, ...prev.filter(r => r.id !== newRecord.id)].slice(0, 25);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecentRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllRecords = () => {
    setRecentRecords([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Document A selection & async extraction
  const handleFileASelected = async (file: File) => {
    setFileA(file);
    setExtractedA(null);
    setIsExtractingA(true);
    setErrorMessage(null);
    try {
      const extracted = await DocumentExtractor.extract(file);
      setExtractedA(extracted);
    } catch (err: any) {
      setErrorMessage(`Failed to extract content from ${file.name}`);
    } finally {
      setIsExtractingA(false);
    }
  };

  // Document B selection & async extraction
  const handleFileBSelected = async (file: File) => {
    setFileB(file);
    setExtractedB(null);
    setIsExtractingB(true);
    setErrorMessage(null);
    try {
      const extracted = await DocumentExtractor.extract(file);
      setExtractedB(extracted);
    } catch (err: any) {
      setErrorMessage(`Failed to extract content from ${file.name}`);
    } finally {
      setIsExtractingB(false);
    }
  };

  // Swap Document A & B
  const handleSwap = () => {
    const tempFile = fileA;
    const tempExt = extractedA;
    setFileA(fileB);
    setExtractedA(extractedB);
    setFileB(tempFile);
    setExtractedB(tempExt);

    if (result) {
      // Re-run comparison with swapped roles
      handleRunComparison(fileB!, fileA!);
    }
  };

  // Run Comparison Workflow
  const handleRunComparison = async (fA = fileA, fB = fileB) => {
    if (!fA || !fB) return;
    setIsComparing(true);
    setProgressPercent(10);
    setProgressMessage('Starting extraction & analysis...');
    setErrorMessage(null);

    try {
      const res = await AISummaryService.runComparison(
        fA,
        fB,
        { mode: comparisonMode, style: summaryStyle },
        (pct, msg) => {
          setProgressPercent(pct);
          setProgressMessage(msg);
        }
      );

      setResult(res);
      saveRecordToHistory(res);
      setCurrentChangeIndex(0);

      if (res.statistics.totalChanges > 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Comparison failed. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  // Navigate Changes
  const meaningfulChanges = result?.changes.filter(c => c.type !== 'unchanged') || [];
  const currentActiveChange = meaningfulChanges[currentChangeIndex];

  const handleNextChange = () => {
    if (currentChangeIndex < meaningfulChanges.length - 1) {
      setCurrentChangeIndex(prev => prev + 1);
    }
  };

  const handlePrevChange = () => {
    if (currentChangeIndex > 0) {
      setCurrentChangeIndex(prev => prev - 1);
    }
  };

  // Search occurrences count calculation
  useEffect(() => {
    if (!searchQuery || !result) {
      setMatchCount(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    let count = 0;
    for (const ch of result.changes) {
      if (ch.originalText?.toLowerCase().includes(q)) count++;
      if (ch.updatedText?.toLowerCase().includes(q)) count++;
    }
    setMatchCount(count);
    setCurrentMatchIndex(0);
  }, [searchQuery, result]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Master Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-brand-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>High-Precision Semantic Difference Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Document Comparison
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
            Compare two documents, identify every important change, and understand what was added, removed, or modified.
          </p>
        </div>

        {/* Action Controls & Format Pills */}
        <div className="flex flex-col items-start md:items-end gap-3 z-10">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold transition-all"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Comparison History ({recentRecords.length})</span>
          </button>

          <div className="flex flex-wrap gap-1.5 max-w-sm justify-start md:justify-end">
            {['PDF', 'DOC', 'DOCX', 'TXT', 'PPT', 'PPTX', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-white border border-white/10">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error Banner */}
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

      {/* 2. Main Upload Dropzone & Setup */}
      {!result && (
        <CompareDropzone
          fileA={fileA}
          fileB={fileB}
          extractedA={extractedA}
          extractedB={extractedB}
          isExtractingA={isExtractingA}
          isExtractingB={isExtractingB}
          onFileASelected={handleFileASelected}
          onFileBSelected={handleFileBSelected}
          onSwapFiles={handleSwap}
          onRemoveFileA={() => { setFileA(null); setExtractedA(null); }}
          onRemoveFileB={() => { setFileB(null); setExtractedB(null); }}
          onPreviewFile={(doc) => setPreviewDoc(doc)}
          onCompare={() => handleRunComparison()}
          isComparing={isComparing}
          comparisonMode={comparisonMode}
          onModeChange={setComparisonMode}
        />
      )}

      {/* Progress Bar when Comparing */}
      {isComparing && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
              {progressMessage}
            </span>
            <span className="font-mono text-brand-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Comparison Result Workspace */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Summary & Statistics */}
          <SummaryAndStatsPanel
            result={result}
            onStyleChange={(st) => {
              setSummaryStyle(st);
              handleRunComparison();
            }}
          />

          {/* Sticky Interactive Toolbar */}
          <ComparisonToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            currentChangeIndex={currentChangeIndex}
            totalChanges={meaningfulChanges.length}
            onNextChange={handleNextChange}
            onPrevChange={handlePrevChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            matchCount={matchCount}
            currentMatchIndex={currentMatchIndex}
            onNextMatch={() => setCurrentMatchIndex(prev => (prev + 1) % Math.max(1, matchCount))}
            onPrevMatch={() => setCurrentMatchIndex(prev => (prev - 1 + matchCount) % Math.max(1, matchCount))}
            addedCount={result.statistics.addedCount}
            removedCount={result.statistics.removedCount}
            modifiedCount={result.statistics.modifiedCount}
            movedCount={result.statistics.movedCount}
            onNewComparison={() => {
              setResult(null);
              setFileA(null);
              setFileB(null);
              setExtractedA(null);
              setExtractedB(null);
            }}
          />

          {/* Active View Mode Container */}
          {viewMode === 'side_by_side' && (
            <SideBySideView
              changes={result.changes}
              fileAName={result.fileA.name}
              fileBName={result.fileB.name}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
              currentChangeId={currentActiveChange?.id}
              onSelectChange={(ch) => {
                const idx = meaningfulChanges.findIndex(m => m.id === ch.id);
                if (idx !== -1) setCurrentChangeIndex(idx);
              }}
            />
          )}

          {viewMode === 'unified' && (
            <UnifiedDiffView
              changes={result.changes}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
              currentChangeId={currentActiveChange?.id}
              onSelectChange={(ch) => {
                const idx = meaningfulChanges.findIndex(m => m.id === ch.id);
                if (idx !== -1) setCurrentChangeIndex(idx);
              }}
            />
          )}

          {viewMode === 'changes_only' && (
            <ChangesOnlyView
              changes={result.changes}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
              currentChangeId={currentActiveChange?.id}
              onSelectChange={(ch) => {
                const idx = meaningfulChanges.findIndex(m => m.id === ch.id);
                if (idx !== -1) setCurrentChangeIndex(idx);
              }}
            />
          )}

          {viewMode === 'original_only' && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs leading-relaxed max-h-[700px] overflow-y-auto space-y-2">
              <h4 className="text-sm font-bold font-sans text-slate-900 dark:text-white mb-4">
                Original Document &bull; {result.fileA.name}
              </h4>
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {result.fileA.rawText}
              </div>
            </div>
          )}

          {viewMode === 'new_only' && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs leading-relaxed max-h-[700px] overflow-y-auto space-y-2">
              <h4 className="text-sm font-bold font-sans text-slate-900 dark:text-white mb-4">
                New / Updated Version &bull; {result.fileB.name}
              </h4>
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {result.fileB.rawText}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. Preview Document Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Document Preview &bull; {previewDoc.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Format: {previewDoc.format.toUpperCase()} &bull; {previewDoc.wordCount} words &bull; {previewDoc.elements.length} structural elements
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-3 whitespace-pre-wrap">
              {previewDoc.rawText || 'Empty Document'}
            </div>
          </div>
        </div>
      )}

      {/* 5. Recent Comparisons History Modal */}
      <RecentComparisonsModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        records={recentRecords}
        onOpenRecord={(rec) => {
          setResult(rec.result);
          setFileA(new File([rec.result.fileA.rawText], rec.result.fileA.name, { type: rec.result.fileA.mimeType }));
          setFileB(new File([rec.result.fileB.rawText], rec.result.fileB.name, { type: rec.result.fileB.mimeType }));
          setExtractedA(rec.result.fileA);
          setExtractedB(rec.result.fileB);
        }}
        onDeleteRecord={handleDeleteRecord}
        onClearAll={handleClearAllRecords}
      />

    </div>
  );
};
