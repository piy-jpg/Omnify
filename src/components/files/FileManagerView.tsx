import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  FileText,
  FileImage,
  Presentation,
  FileSpreadsheet,
  Upload,
  HardDrive,
  Clock,
  Sparkles,
  Bot,
  FolderOpen,
  CheckSquare,
  Square,
  Check,
  Plus,
  RefreshCw,
  FileBox,
  Share2,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { FileItem, StorageInfo } from '../../types';
import { formatBytes, getFileTypeBadge, cleanFileName } from '../../utils/formatters';

interface FileManagerViewProps {
  files: FileItem[];
  storageInfo: StorageInfo;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onDeleteFile: (fileId: string) => void;
  onUploadClick: () => void;
  onOpenInAiAssistant?: (file: FileItem) => void;
  onOpenInStudio?: (file: FileItem) => void;
  onClearAllFiles?: () => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  storageInfo,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  onUploadClick,
  onOpenInAiAssistant,
  onOpenInStudio,
  onClearAllFiles
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const filteredFiles = (files || []).filter(f => {
    if (!f) return false;
    const clean = cleanFileName(f.name || '').toLowerCase();
    const ext = (f.extension || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = clean.includes(query) || ext.includes(query);
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'pdf') return matchesSearch && ext.toUpperCase() === 'PDF';
    if (selectedFilter === 'images') return matchesSearch && ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext.toUpperCase());
    if (selectedFilter === 'docs') return matchesSearch && ['DOCX', 'DOC', 'PPTX', 'TXT', 'RTF'].includes(ext.toUpperCase());
    if (selectedFilter === 'spreadsheets') return matchesSearch && ['XLSX', 'XLS', 'CSV'].includes(ext.toUpperCase());
    return matchesSearch;
  });

  const getFileIcon = (ext?: string) => {
    const upper = (ext || '').toUpperCase();
    if (upper === 'PDF') return <FileText className="w-5 h-5 text-rose-500" />;
    if (['DOCX', 'DOC', 'TXT', 'RTF'].includes(upper)) return <FileText className="w-5 h-5 text-blue-500" />;
    if (upper === 'PPTX' || upper === 'PPT') return <Presentation className="w-5 h-5 text-orange-500" />;
    if (upper === 'XLSX' || upper === 'XLS' || upper === 'CSV') return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(upper)) return <FileImage className="w-5 h-5 text-purple-500" />;
    return <FileBox className="w-5 h-5 text-slate-500" />;
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const toggleFile = (id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = () => {
    selectedFileIds.forEach(id => onDeleteFile(id));
    setSelectedFileIds(new Set());
  };

  const handleBatchDownload = () => {
    files.filter(f => selectedFileIds.has(f.id)).forEach(f => onDownloadFile(f));
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Storage Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Files & Conversions
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              {(files || []).length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your recent documents, trigger instant AI Q&A, preview contents, or convert files with 1-click.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New File</span>
          </button>

          {onClearAllFiles && (files || []).length > 0 && (
            <button
              onClick={onClearAllFiles}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Clear recent file history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar with Batch Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recent files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'pdf', 'docs', 'spreadsheets', 'images'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Files' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Actions Bar (when files selected) */}
      {selectedFileIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <span className="font-bold text-brand-900 dark:text-brand-100">
            {selectedFileIds.size} file{selectedFileIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selected</span>
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Files Table / Grid */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 sm:px-6">File Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredFiles.map(file => {
                const badge = getFileTypeBadge(file.extension);
                const isSelected = selectedFileIds.has(file.id);
                const cleanName = cleanFileName(file.name);

                return (
                  <tr
                    key={file.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleFile(file.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* File Name + Icon */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => onPreviewFile(file)}
                          className={`p-2 rounded-xl ${badge.bg} border ${badge.border} cursor-pointer hover:scale-105 transition-transform`}
                          title="Click to preview"
                        >
                          {getFileIcon(file.extension)}
                        </div>
                        <div className="min-w-0">
                          <p
                            onClick={() => onPreviewFile(file)}
                            className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md cursor-pointer hover:text-brand-600 transition-colors"
                            title={cleanName}
                          >
                            {cleanName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {file.pages ? `${file.pages} pages • ` : ''}Encrypted & ready
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Extension Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                        {file.extension}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {formatBytes(file.size)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {file.uploadedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Chat with AI */}
                        {onOpenInAiAssistant && (
                          <button
                            onClick={() => onOpenInAiAssistant(file)}
                            className="p-1.5 rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
                            title="Chat with this file in AI Assistant"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                        )}

                        {/* Open in Universal Studio */}
                        {onOpenInStudio && (
                          <button
                            onClick={() => onOpenInStudio(file)}
                            className="p-1.5 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title="Open in Universal File Studio"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        )}

                        {/* Download */}
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete from recent files"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No matching files found</p>
                    <p className="text-xs text-slate-400">Upload documents or convert files to see them listed here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
