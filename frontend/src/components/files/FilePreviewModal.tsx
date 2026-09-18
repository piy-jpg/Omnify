import React from 'react';
import { X, Download, FileText, FileImage, ShieldCheck, Sparkles } from 'lucide-react';
import { FileItem } from '../../types';
import { formatBytes } from '../../utils/formatters';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onOpenWithAI?: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  onOpenWithAI
}) => {
  if (!file) return null;

  const isImage = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(file.extension.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600">
              {isImage ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</h3>
              <p className="text-[11px] text-slate-400">{file.extension} • {formatBytes(file.size)} • {file.uploadedAt}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Container */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[260px] bg-slate-50 dark:bg-slate-950/40">
          {file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              className="max-h-72 rounded-2xl object-contain shadow-md border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="text-center space-y-3 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{file.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{file.pages || 1} pages • Formatted Document</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted & Verified</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={() => onOpenWithAI?.(file)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chat with AI</span>
          </button>

          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </button>
        </div>

      </div>
    </div>
  );
};
