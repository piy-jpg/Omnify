import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  FileText,
  Command,
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { ToolItem, FileItem } from '../../types';
import { IconHelper } from '../common/IconHelper';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolItem[];
  recentFiles: FileItem[];
  onSelectTool: (tool: ToolItem) => void;
  onSelectFile: (file: FileItem) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tools,
  recentFiles,
  onSelectTool,
  onSelectFile
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase()) ||
    t.fromFormat.toLowerCase().includes(query.toLowerCase()) ||
    t.toFormat.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFiles = recentFiles.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, conversions, recent files..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="p-3 overflow-y-auto max-h-96 space-y-4">
          
          {/* Tools category */}
          {filteredTools.length > 0 && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tools & Converters ({filteredTools.length})
              </div>
              <div className="space-y-1">
                {filteredTools.slice(0, 8).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-50/70 dark:hover:bg-brand-950/40 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <IconHelper name={tool.iconName} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {tool.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 group-hover:text-brand-600 font-medium">
                      <span>{tool.toFormat}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files category */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recent Files ({filteredFiles.length})
              </div>
              <div className="space-y-1">
                {filteredFiles.slice(0, 4).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      onSelectFile(file);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{file.uploadedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTools.length === 0 && filteredFiles.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching tools or documents found for "{query}".
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border text-[10px]">↓</kbd>
          </div>
          <div className="flex items-center gap-1">
            <span>Select:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border text-[10px]">Enter</kbd>
          </div>
        </div>

      </div>
    </div>
  );
};
