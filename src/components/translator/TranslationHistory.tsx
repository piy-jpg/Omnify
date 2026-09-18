import React from 'react';
import { X, Clock, Trash2, Download, ExternalLink, ArrowRight, Languages } from 'lucide-react';
import { AITranslationService } from '../../services/ai/aiTranslationService';

export interface TranslationHistoryItem {
  id: string;
  title: string;
  sourceLang: string;
  sourceLangName: string;
  targetLang: string;
  targetLangName: string;
  timestamp: string;
  wordCount: number;
  translatedText: string;
}

interface TranslationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranslationHistoryItem[];
  onLoadHistoryItem: (item: TranslationHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAll: () => void;
}

export const TranslationHistory: React.FC<TranslationHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onLoadHistoryItem,
  onDeleteHistoryItem,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recent Translations
              </h3>
              <p className="text-xs text-slate-400">
                {history.length} saved session records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition-colors mr-1"
                title="Clear all history"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length > 0 ? (
            history.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all space-y-2.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                      {item.sourceLangName} ➔ {item.targetLangName}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  {item.translatedText}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>{item.timestamp} &bull; {item.wordCount} words</span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => AITranslationService.exportAsTxt(item.translatedText, `${item.title}_trans.txt`)}
                      className="p-1 hover:text-brand-600 transition-colors"
                      title="Download as TXT"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onLoadHistoryItem(item);
                        onClose();
                      }}
                      className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Languages className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No translation history yet</p>
              <p className="text-[11px]">Your completed translations will be conveniently saved here.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <p className="text-[11px] text-slate-400">
            Privacy Protected &bull; Session data stored locally
          </p>
        </div>

      </div>
    </div>
  );
};
