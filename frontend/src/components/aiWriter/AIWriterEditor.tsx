import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Download,
  FileText,
  FileCode,
  Sparkles,
  Scissors,
  GraduationCap,
  Smile,
  CheckCheck,
  RefreshCw,
  Globe,
  Trash2,
  Edit2,
  Eye,
  Layers,
  FileSignature,
  FileSpreadsheet
} from 'lucide-react';
import {
  WritingContentType,
  WritingVersion,
  AIEditActionType
} from '../../types/aiWriter';
import {
  exportContentToPdf,
  exportContentToDocx,
  exportContentToTxt
} from '../../services/ai/aiWriterService';

interface AIWriterEditorProps {
  type: WritingContentType;
  subject?: string;
  title?: string;
  content: string;
  versions: WritingVersion[];
  currentVersionIndex: number;
  onSelectVersion: (index: number) => void;
  onChangeContent: (content: string) => void;
  onChangeSubject?: (subject: string) => void;
  onRegenerate: () => void;
  onExecuteEditAction: (action: AIEditActionType, targetLanguage?: string) => void;
  isEditingAI: boolean;
  onClear: () => void;
}

export const AIWriterEditor: React.FC<AIWriterEditorProps> = ({
  type,
  subject,
  title,
  content,
  versions,
  currentVersionIndex,
  onSelectVersion,
  onChangeContent,
  onChangeSubject,
  onRegenerate,
  onExecuteEditAction,
  isEditingAI,
  onClear
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  // Clean duplicate subject from content body if already rendered in header
  const cleanDisplayContent = React.useMemo(() => {
    if (!subject) return content;
    // Remove duplicate "Subject: ..." line if it appears right after greeting/header in body
    const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^Subject:\\s*${escapedSubject}\\s*\\n+`, 'i');
    return content.replace(regex, '');
  }, [content, subject]);

  const handleCopy = async () => {
    let fullText = '';
    if (subject) fullText += `Subject: ${subject}\n\n`;
    if (title) fullText += `Title: ${title}\n\n`;
    fullText += content;

    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    const filenameBase = (subject || title || 'ai_document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 30);

    if (format === 'pdf') {
      exportContentToPdf(subject, title, content, `${filenameBase}.pdf`);
    } else if (format === 'docx') {
      exportContentToDocx(subject, title, content, `${filenameBase}.docx`);
    } else {
      exportContentToTxt(subject, title, content, `${filenameBase}.txt`);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* 1. Unified Top Navigation Bar */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Document Preview
          </span>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isEditMode
                ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Edit Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Executive Paper Document Canvas */}
      <div className="p-6 sm:p-10 space-y-6 font-sans min-h-[460px] bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/40">
        {/* Header Subject or Title Banner */}
        {(subject || onChangeSubject) && (
          <div className="space-y-1.5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md inline-block">
              Subject Line
            </span>
            {isEditMode && onChangeSubject ? (
              <input
                type="text"
                value={subject || ''}
                onChange={(e) => onChangeSubject(e.target.value)}
                className="w-full text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-brand-500 focus:outline-none py-1"
              />
            ) : (
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                {subject}
              </h2>
            )}
          </div>
        )}

        {title && !subject && (
          <div className="space-y-1 pb-4 border-b border-slate-200/80 dark:border-slate-800 text-center">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}

        {/* Main Document Body */}
        {isEditMode ? (
          <textarea
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            rows={14}
            className="w-full text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-y"
          />
        ) : (
          <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap selection:bg-brand-500/20 font-normal">
            {cleanDisplayContent.split(/(\[[A-Za-z0-9\s/.,()#-]+\])/g).map((part, pIdx) => {
              const isPlaceholder = part.startsWith('[') && part.endsWith(']');
              if (isPlaceholder) {
                return (
                  <span
                    key={pIdx}
                    className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20"
                    title="Placeholder: replace with your actual details"
                  >
                    {part}
                  </span>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom Action Dock */}
      <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Document'}</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Generate another version with the same parameters"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('docx')}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Word</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('txt')}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer"
            title="Clear Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
