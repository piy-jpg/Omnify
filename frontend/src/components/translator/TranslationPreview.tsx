import React, { useRef, useState } from 'react';
import { Copy, Check, Edit3, Volume2, Sparkles, Split, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { DocumentSection } from '../../services/ai/aiTranslationService';

interface TranslationPreviewProps {
  sourceText: string;
  translatedText: string;
  sourceLanguageName: string;
  targetLanguageName: string;
  sections?: DocumentSection[];
  isEditing: boolean;
  onTranslatedTextChange: (newText: string) => void;
  showDiff?: boolean;
}

export const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  sourceText,
  translatedText,
  sourceLanguageName,
  targetLanguageName,
  sections = [],
  isEditing,
  onTranslatedTextChange,
  showDiff = false
}) => {
  const [sourceCopied, setSourceCopied] = useState(false);
  const [targetCopied, setTargetCopied] = useState(false);

  const sourceWords = sourceText.split(/\s+/).filter(Boolean).length;
  const targetWords = translatedText.split(/\s+/).filter(Boolean).length;

  const sourceParagraphs = sourceText.split(/\n\n+/).filter(Boolean);
  const targetParagraphs = translatedText.split(/\n\n+/).filter(Boolean);

  const maxParagraphs = Math.max(sourceParagraphs.length, targetParagraphs.length);

  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);

  const handleCopySource = () => {
    navigator.clipboard.writeText(sourceText);
    setSourceCopied(true);
    setTimeout(() => setSourceCopied(false), 2000);
  };

  const handleCopyTarget = () => {
    navigator.clipboard.writeText(translatedText);
    setTargetCopied(true);
    setTimeout(() => setTargetCopied(false), 2000);
  };

  const handleSpeakSource = () => {
    if (!sourceText.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingSource) {
      window.speechSynthesis.cancel();
      setIsSpeakingSource(false);
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeakingTarget(false);
    const utterance = new SpeechSynthesisUtterance(sourceText);
    utterance.onend = () => setIsSpeakingSource(false);
    utterance.onerror = () => setIsSpeakingSource(false);
    setIsSpeakingSource(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakTarget = () => {
    if (!translatedText.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingTarget) {
      window.speechSynthesis.cancel();
      setIsSpeakingTarget(false);
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeakingSource(false);
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.onend = () => setIsSpeakingTarget(false);
    utterance.onerror = () => setIsSpeakingTarget(false);
    setIsSpeakingTarget(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      
      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT PANE: SOURCE CONTENT */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Original ({sourceLanguageName})
              </span>
              <button
                type="button"
                onClick={handleSpeakSource}
                disabled={!sourceText.trim()}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                  isSpeakingSource
                    ? 'bg-purple-600 text-white animate-pulse'
                    : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100'
                }`}
                title="Listen to original text"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeakingSource ? 'Stop' : 'Listen'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>{sourceWords} words</span>
              <span>&bull;</span>
              <span>{sourceText.length} chars</span>
              <button
                onClick={handleCopySource}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors ml-1 cursor-pointer"
                title="Copy source text"
              >
                {sourceCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>


          {/* Content Area */}
          <div className="p-4 sm:p-5 flex-1 max-h-[500px] overflow-y-auto space-y-3 font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {showDiff ? (
              // Structured Paragraph Rows
              Array.from({ length: maxParagraphs }).map((_, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400">§ {idx + 1}</div>
                  <p className="whitespace-pre-wrap">{sourceParagraphs[idx] || '—'}</p>
                </div>
              ))
            ) : (
              sourceParagraphs.map((para, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: TRANSLATED CONTENT */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900/60 shadow-md shadow-brand-500/5 flex flex-col overflow-hidden ring-1 ring-brand-500/10">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-brand-100 dark:border-brand-950/60 bg-brand-50/30 dark:bg-brand-950/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Translation ({targetLanguageName})
              </span>
              <button
                type="button"
                onClick={handleSpeakTarget}
                disabled={!translatedText.trim()}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                  isSpeakingTarget
                    ? 'bg-purple-600 text-white animate-pulse'
                    : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100'
                }`}
                title="Listen to translated text"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeakingTarget ? 'Stop' : 'Listen'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-brand-600 dark:text-brand-400 font-bold">{targetWords} words</span>
              <span>&bull;</span>
              <span>{translatedText.length} chars</span>
              <button
                onClick={handleCopyTarget}
                className="p-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-950 text-brand-600 dark:text-brand-400 transition-colors ml-1 cursor-pointer"
                title="Copy translated text"
              >
                {targetCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-5 flex-1 max-h-[500px] overflow-y-auto space-y-3 font-sans text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
            {isEditing ? (
              <textarea
                value={translatedText}
                onChange={(e) => onTranslatedTextChange(e.target.value)}
                className="w-full h-80 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed resize-none"
                placeholder="Edit translated text directly..."
              />
            ) : showDiff ? (
              Array.from({ length: maxParagraphs }).map((_, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-brand-50/40 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">§ {idx + 1}</div>
                  <p className="whitespace-pre-wrap font-medium">{targetParagraphs[idx] || '—'}</p>
                </div>
              ))
            ) : (
              targetParagraphs.map((para, idx) => (
                <p key={idx} className="whitespace-pre-wrap font-medium">
                  {para}
                </p>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
