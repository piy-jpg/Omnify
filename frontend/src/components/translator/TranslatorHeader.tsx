import React from 'react';
import { Languages, Sparkles, Zap, ShieldCheck, FileText, Layers, RefreshCw, Cpu } from 'lucide-react';

interface TranslatorHeaderProps {
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const TranslatorHeader: React.FC<TranslatorHeaderProps> = ({
  onOpenHistory,
  historyCount = 0
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Title & Description */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500/20 text-brand-300 border border-brand-400/30 backdrop-blur-md">
              <Languages className="w-3.5 h-3.5 text-brand-400" />
              <span>ConvertPro AI Translator</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>100+ Global Languages &bull; 100% Free</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Neural Multilingual <span className="bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-300 bg-clip-text text-transparent">Document & Text Translator</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Translate text, documents, PDFs, presentations, and images into 100+ languages while preserving original context, typography, headings, tables, and slide structures.
          </p>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono font-bold text-slate-300">
            <span className="text-slate-400 font-sans font-medium text-xs">Supported Inputs:</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-indigo-200">TEXT</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-rose-300">PDF</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-blue-300">DOCX</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-amber-300">PPTX</span>
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-purple-300">JPG/PNG/WEBP</span>
          </div>
        </div>

        {/* Right Info & History Action */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Tier AI Engine</span>
            </div>
          </div>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-300" />
              <span>Recent Translations</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-brand-500 text-white text-[10px] font-mono">
                  {historyCount}
                </span>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
