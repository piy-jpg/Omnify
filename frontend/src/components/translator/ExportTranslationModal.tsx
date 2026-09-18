import React from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { AITranslationService } from '../../services/ai/aiTranslationService';

interface ExportTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  translatedText: string;
  originalFileName?: string;
  sourceLanguageName: string;
  targetLanguageName: string;
}

export const ExportTranslationModal: React.FC<ExportTranslationModalProps> = ({
  isOpen,
  onClose,
  translatedText,
  originalFileName,
  sourceLanguageName,
  targetLanguageName
}) => {
  if (!isOpen) return null;

  const baseName = originalFileName 
    ? originalFileName.replace(/\.[^/.]+$/, '') 
    : 'ConvertPro_Translation';
  const downloadBase = `${baseName}_${targetLanguageName.replace(/\s+/g, '_')}`;

  const handleExportTxt = () => {
    AITranslationService.exportAsTxt(translatedText, `${downloadBase}.txt`);
    onClose();
  };

  const handleExportPdf = () => {
    AITranslationService.exportAsPdf(translatedText, `${downloadBase}.pdf`, `${baseName} (${targetLanguageName})`);
    onClose();
  };

  const handleExportDocx = () => {
    AITranslationService.exportAsDocx(translatedText, `${downloadBase}.docx`);
    onClose();
  };

  const handleExportPptx = () => {
    AITranslationService.exportAsPptx(translatedText, `${downloadBase}.pptx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Export Translation
              </h3>
              <p className="text-xs text-slate-400">
                {sourceLanguageName} ➔ {targetLanguageName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Select your preferred document export format:
          </p>

          {/* Option 1: PDF */}
          <button
            onClick={handleExportPdf}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 bg-white dark:bg-slate-800/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all text-left group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  PDF Document (.pdf)
                </h4>
                <p className="text-[11px] text-slate-400">Formatted vector document with headers</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </button>

          {/* Option 2: DOCX */}
          <button
            onClick={handleExportDocx}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Microsoft Word (.docx)
                </h4>
                <p className="text-[11px] text-slate-400">Fully editable Word XML with preserved paragraphs</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>

          {/* Option 3: PPTX */}
          <button
            onClick={handleExportPptx}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all text-left group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  PowerPoint Presentation (.pptx)
                </h4>
                <p className="text-[11px] text-slate-400">Slide deck with structured slide layout</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </button>

          {/* Option 4: Plain TXT */}
          <button
            onClick={handleExportTxt}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Plain Text File (.txt)
                </h4>
                <p className="text-[11px] text-slate-400">Standard UTF-8 clean text file</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
