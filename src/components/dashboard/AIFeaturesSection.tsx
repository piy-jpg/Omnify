import React from 'react';
import { 
  Bot, 
  ScanLine, 
  Sparkles, 
  ArrowRight, 
  Stars, 
  Zap, 
  FileSpreadsheet, 
  Presentation, 
  Eraser, 
  QrCode, 
  CheckCircle2, 
  Flame,
  Layers,
  Languages,
  PenTool,
  Wand2,
  FileText,
  GitCompare
} from 'lucide-react';

interface AIFeaturesSectionProps {
  onOpenAIAssistant: () => void;
  onOpenOCR: () => void;
  onOpenGenerators: () => void;
  onOpenTranslator?: () => void;
  onOpenDocCompare?: () => void;
  onOpenPresentation?: () => void;
  onOpenWatermarkRemover?: () => void;
  onOpenUniversalQr?: () => void;
  onOpenAIWriter?: () => void;
}

export const AIFeaturesSection: React.FC<AIFeaturesSectionProps> = ({
  onOpenAIAssistant,
  onOpenOCR,
  onOpenGenerators,
  onOpenTranslator,
  onOpenDocCompare,
  onOpenPresentation,
  onOpenWatermarkRemover,
  onOpenUniversalQr,
  onOpenAIWriter
}) => {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-brand-600 text-white shadow-md shadow-purple-500/20">
            <Stars className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Next-Gen AI Intelligence Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> GPT-4o Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              State-of-the-art multimodal AI engines for document intelligence, writing & media synthesis
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 rounded-full border border-purple-200/50 dark:border-purple-800/50">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Unlimited AI Processing Active</span>
        </div>
      </div>

      {/* 3 Premium Feature Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: AI DOCUMENT ASSISTANT */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-purple-800/50 flex flex-col justify-between group hover:shadow-2xl hover:border-purple-500/80 transition-all duration-300">
          {/* Ambient Orb */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40 backdrop-blur-md">
                UNLIMITED COPILOT
              </span>
            </div>

            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-purple-300 mb-1">
              Interactive Document Assistant
            </span>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">
              AI Document Copilot
            </h3>
            <p className="text-xs text-purple-100/80 leading-relaxed mb-4 font-normal">
              Chat directly with PDFs, summarize 100+ page contracts, generate instant quizzes, and conduct side-by-side diff comparisons.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-purple-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-document Q&A chat engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Executive summaries & key takeaways</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10">
            <button
              onClick={onOpenAIAssistant}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-extrabold text-xs shadow-lg transition-all group/btn hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch AI Copilot</span>
              <ArrowRight className="w-4 h-4 text-purple-700 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: OCR & EXTRACT */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-blue-800/50 flex flex-col justify-between group hover:shadow-2xl hover:border-blue-500/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-all" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <ScanLine className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 backdrop-blur-md">
                NEURAL OCR v4.8
              </span>
            </div>

            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-blue-300 mb-1">
              Computer Vision Text & Tables
            </span>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">
              OCR & Table Extractor
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed mb-4 font-normal">
              Convert scanned paperwork and screenshots into editable Word DOCX, structured Excel spreadsheets, and clean searchable text.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-blue-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bounding-box table cell recognition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multilingual handwriting & printed font</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10">
            <button
              onClick={onOpenOCR}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-blue-50 text-indigo-950 font-extrabold text-xs shadow-lg transition-all group/btn hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch OCR Engine</span>
              <ArrowRight className="w-4 h-4 text-blue-700 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 3: DOCUMENT GENERATORS */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-amber-800/50 flex flex-col justify-between group hover:shadow-2xl hover:border-amber-500/80 transition-all duration-300">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/30 transition-all" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 backdrop-blur-md">
                VECTOR PDF STUDIO
              </span>
            </div>

            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
              Instant Document Generator
            </span>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">
              Document Generators
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed mb-4 font-normal">
              Build executive resumes, itemized tax invoices, and formal business proposals with live vector preview and 1-click PDF download.
            </p>

            <div className="space-y-1.5 mb-5 text-[11px] text-amber-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Executive ATS-friendly resume templates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tax calculations & currency localization</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-white/10">
            <button
              onClick={onOpenGenerators}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-xs shadow-lg transition-all group/btn hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Doc Generators</span>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Flagship Specialty AI Tools Banner Strip */}
      {(onOpenAIWriter || onOpenTranslator || onOpenPresentation || onOpenWatermarkRemover || onOpenUniversalQr) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
          
          {/* Item 0: AI Writer */}
          {onOpenAIWriter && (
            <div
              onClick={onOpenAIWriter}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      AI Writer
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      GPT-4o
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Emails, letters & notices</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

          {/* Item 0: AI Document Comparison */}
          {onOpenDocCompare && (
            <div
              onClick={onOpenDocCompare}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-brand-400 dark:hover:border-brand-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      AI Doc Comparison
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Side-by-side exact diff</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

          {/* Item 1: AI Translator */}
          {onOpenTranslator && (
            <div
              onClick={onOpenTranslator}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-brand-400 dark:hover:border-brand-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      AI Translator
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      100+ LANG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">PDF, DOCX & text</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

          {/* Item 2: Presentation Gen */}
          {onOpenPresentation && (
            <div
              onClick={onOpenPresentation}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Presentation className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Presentation Gen
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      PPTX
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">10+ slides in seconds</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

          {/* Item 3: Watermark Remover */}
          {onOpenWatermarkRemover && (
            <div
              onClick={onOpenWatermarkRemover}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-purple-400 dark:hover:border-purple-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Eraser className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Watermark Remover
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Logos, stamps & text</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

          {/* Item 4: Universal QR Studio */}
          {onOpenUniversalQr && (
            <div
              onClick={onOpenUniversalQr}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Universal QR
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">File & WiFi QR codes</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
          )}

        </div>
      )}

    </section>
  );
};
