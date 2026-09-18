import React, { useState } from 'react';
import { 
  Bookmark, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  FileImage, 
  Presentation, 
  Star,
  Lock
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, getFileTypeBadge } from '../utils/formatters';

interface SavedFilesPageProps {
  files: FileItem[];
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onDeleteFile: (fileId: string) => void;
}

export const SavedFilesPage: React.FC<SavedFilesPageProps> = ({
  files,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile
}) => {
  const [search, setSearch] = useState('');

  const savedList = files.slice(0, 4); // Saved/Pinned items

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <Bookmark className="w-3.5 h-3.5 text-emerald-200" />
            <span>Encrypted Saved Vault</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pinned & Permanent Saved Documents
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Files stored in your encrypted persistent vault are exempt from 24-hour auto-purges and accessible on all your devices.
          </p>
        </div>
      </div>

      {/* Grid of Saved items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Vault Documents ({savedList.length})</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> AES-256
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedList.map(file => {
            const badge = getFileTypeBadge(file.extension);
            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${badge.bg} border ${badge.border}`}>
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{formatBytes(file.size)} &bull; Saved Permanently</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadFile(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
