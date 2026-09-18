import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  Presentation,
  MoreVertical,
  Upload,
  CopyPlus,
  Minimize2,
  Sparkles,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Crown,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { FileItem } from '../../types';
import { getFileTypeBadge, formatBytes } from '../../utils/formatters';

interface RightSidebarProps {
  recentFiles: FileItem[];
  onOpenFilePreview: (file: FileItem) => void;
  onDeleteFile: (fileId: string) => void;
  onSelectQuickAction: (actionId: string) => void;
  onOpenUpgrade: () => void;
  onDownloadFile: (file: FileItem) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  recentFiles,
  onOpenFilePreview,
  onDeleteFile,
  onSelectQuickAction,
  onOpenUpgrade,
  onDownloadFile
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getFileIcon = (ext: string) => {
    const upper = ext.toUpperCase();
    if (upper === 'PDF') return <FileText className="w-4 h-4 text-rose-500" />;
    if (upper === 'DOCX' || upper === 'DOC') return <FileText className="w-4 h-4 text-blue-500" />;
    if (upper === 'PPTX' || upper === 'PPT') return <Presentation className="w-4 h-4 text-orange-500" />;
    return <FileImage className="w-4 h-4 text-purple-500" />;
  };

  const quickActions = [
    { id: 'upload-generic', label: 'Upload File', icon: Upload, color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/50' },
    { id: 'merge-pdf', label: 'Merge PDF', icon: CopyPlus, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
    { id: 'compress-pdf', label: 'Compress PDF', icon: Minimize2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { id: 'ocr-extract', label: 'OCR Extract', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
  ];

  return (
    <aside className="w-80 flex-shrink-0 space-y-6 hidden xl:block">
      
      {/* Quick Actions Grid */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onSelectQuickAction(action.id)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group"
              >
                <div className={`p-1.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Files List */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recent Files
          </h3>
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">
            View All ({recentFiles.length})
          </span>
        </div>

        <div className="space-y-2">
          {recentFiles.slice(0, 6).map(file => {
            const badge = getFileTypeBadge(file.extension);
            const isMenuOpen = activeMenuId === file.id;

            return (
              <div
                key={file.id}
                className="group relative flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
              >
                {/* File Details */}
                <div 
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onOpenFilePreview(file)}
                >
                  <div className={`p-2 rounded-xl ${badge.bg} border ${badge.border} flex-shrink-0`}>
                    {getFileIcon(file.extension)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{file.extension}</span>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                {/* 3-Dot Action Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : file.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          onOpenFilePreview(file);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => {
                          onDownloadFile(file);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => {
                          onDeleteFile(file.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 100% Free Unlimited Pass Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand-900 to-purple-950 text-white p-5 shadow-lg shadow-indigo-950/30 border border-indigo-700/40">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 backdrop-blur-sm border border-emerald-500/30 mb-3">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>100% FREE FOREVER</span>
          </div>

          <h4 className="text-lg font-bold tracking-tight text-white mb-1.5">
            Unlimited Free Pass
          </h4>

          <p className="text-xs text-indigo-200/90 leading-relaxed mb-4">
            Omnify is completely free for everyone. Enjoy unlimited conversions, AI tools & 2 TB cloud storage.
          </p>

          <div className="space-y-1.5 mb-4 text-[11px] text-indigo-100/90">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>Unlimited conversions & batch files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>2 TB Free Cloud Storage included</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>Unlimited OCR & AI Document Assistant</span>
            </div>
          </div>

          <button
            onClick={onOpenUpgrade}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-md transition-all group"
          >
            <span>View Free Perks & Storage</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

    </aside>
  );
};
