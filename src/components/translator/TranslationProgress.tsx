import React from 'react';
import { Loader2, Sparkles, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react';

interface TranslationProgressProps {
  currentStage: string;
  percent: number;
  fileName?: string;
  sourceLanguageName?: string;
  targetLanguageName?: string;
}

export const TranslationProgress: React.FC<TranslationProgressProps> = ({
  currentStage,
  percent,
  fileName,
  sourceLanguageName,
  targetLanguageName
}) => {
  const steps = [
    { label: 'Content Analysis', threshold: 15 },
    { label: 'Structure Extraction', threshold: 35 },
    { label: 'Token Protection', threshold: 55 },
    { label: 'AI Translation', threshold: 80 },
    { label: 'Rebuilding Preview', threshold: 100 }
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Translating Document Content...
              </h3>
              <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950">
                {percent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {sourceLanguageName || 'Source'} ➔ {targetLanguageName || 'Target'} {fileName ? `• ${fileName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Structure & Tokens Protected</span>
        </div>
      </div>

      {/* Main Animated Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${Math.max(8, percent)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            {currentStage || 'Processing neural translation...'}
          </span>
          <span className="font-mono text-xs">{percent}% Complete</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {steps.map((step, idx) => {
          const isDone = percent >= step.threshold;
          const isCurrent = percent < step.threshold && (idx === 0 || percent >= steps[idx - 1].threshold);

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : isCurrent
                  ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-[9px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider">Step {idx + 1}</span>
              </div>
              <p className="text-[11px] font-semibold truncate">{step.label}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
};
