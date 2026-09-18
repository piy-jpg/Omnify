import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Volume2, 
  Edit3, 
  Sparkles, 
  Award, 
  Feather, 
  Cpu, 
  RefreshCw, 
  Eye, 
  Layers,
  FileText
} from 'lucide-react';

interface TranslationActionsProps {
  onCopy: () => void;
  isCopied: boolean;
  onOpenExportModal: () => void;
  onRefineAction: (action: 'more_formal' | 'simplify' | 'improve_fluency' | 'technical_terms' | 'retranslate') => void;
  isRefining: boolean;
  onToggleEdit: () => void;
  isEditing: boolean;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  onToggleDiff?: () => void;
  showDiff?: boolean;
}

export const TranslationActions: React.FC<TranslationActionsProps> = ({
  onCopy,
  isCopied,
  onOpenExportModal,
  onRefineAction,
  isRefining,
  onToggleEdit,
  isEditing,
  onSpeak,
  isSpeaking = false,
  onToggleDiff,
  showDiff = false
}) => {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
      
      {/* Quick AI Refine Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Smart Polish:
        </span>

        <button
          onClick={() => onRefineAction('improve_fluency')}
          disabled={isRefining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>Improve Fluency</span>
        </button>

        <button
          onClick={() => onRefineAction('more_formal')}
          disabled={isRefining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Award className="w-3 h-3 text-blue-500" />
          <span>Make Formal</span>
        </button>

        <button
          onClick={() => onRefineAction('simplify')}
          disabled={isRefining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Feather className="w-3 h-3 text-teal-500" />
          <span>Simplify</span>
        </button>

        <button
          onClick={() => onRefineAction('technical_terms')}
          disabled={isRefining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Cpu className="w-3 h-3 text-amber-500" />
          <span>Preserve Tech Terms</span>
        </button>

        <button
          onClick={() => onRefineAction('retranslate')}
          disabled={isRefining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Alternative Flow</span>
        </button>
      </div>

      {/* Main Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Left utility tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied!' : 'Copy Translation'}</span>
          </button>

          {onSpeak && (
            <button
              onClick={onSpeak}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isSpeaking
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
            </button>
          )}

          <button
            onClick={onToggleEdit}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isEditing
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Output'}</span>
          </button>

          {onToggleDiff && (
            <button
              onClick={onToggleDiff}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                showDiff
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showDiff ? 'Standard View' : 'Side-by-Side Diff'}</span>
            </button>
          )}
        </div>

        {/* Right Primary Export CTA */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Document (PDF / DOCX / PPTX / TXT)</span>
        </button>

      </div>

    </div>
  );
};
