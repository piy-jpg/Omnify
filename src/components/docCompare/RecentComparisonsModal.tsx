import React from 'react';
import {
  Clock,
  Trash2,
  Download,
  Eye,
  FileText,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { RecentComparisonRecord } from '../../types/docCompare';
import { ExportReportService } from '../../services/docCompare/exportReportService';

interface RecentComparisonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RecentComparisonRecord[];
  onOpenRecord: (record: RecentComparisonRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const RecentComparisonsModal: React.FC<RecentComparisonsModalProps> = ({
  isOpen,
  onClose,
  records,
  onOpenRecord,
  onDeleteRecord,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recent Comparisons History
              </h3>
              <p className="text-xs text-slate-500">
                {records.length} {records.length === 1 ? 'audit record' : 'audit records'} stored locally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl transition-all"
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No comparison history yet</h4>
              <p className="text-xs text-slate-500">Compare two documents to generate audit trails and reports.</p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-850 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {rec.fileAName} <span className="text-slate-400 font-normal">vs</span> {rec.fileBName}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{rec.comparedAt}</span>
                      <span>&bull;</span>
                      <span className="capitalize">{rec.mode} Mode</span>
                      <span>&bull;</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{rec.changeCount} changes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        onOpenRecord(rec);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition-all flex items-center gap-1"
                      title="Open Comparison Result"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => ExportReportService.exportPdf(rec.result)}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-all"
                      title="Download PDF Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(rec.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {rec.summaryOverview}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
