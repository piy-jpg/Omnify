import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  Presentation, 
  Image as ImageIcon,
  Layers
} from 'lucide-react';
import { DocumentSection } from '../../services/ai/aiTranslationService';

interface DocumentPreviewProps {
  fileName: string;
  fileType: 'TXT' | 'PDF' | 'DOCX' | 'PPTX' | 'IMAGE';
  sections: DocumentSection[];
  sourceLanguageName: string;
  targetLanguageName: string;
  imageBlobUrl?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileType,
  sections,
  sourceLanguageName,
  targetLanguageName,
  imageBlobUrl
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Group sections by slide or virtual page
  const itemsPerPage = fileType === 'PPTX' ? 1 : 3;
  const totalPages = Math.max(1, Math.ceil(sections.length / itemsPerPage));
  const displayedSections = sections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(150, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(70, prev - 10));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden space-y-0">
      
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            {fileType === 'PPTX' ? <Presentation className="w-4 h-4" /> : fileType === 'IMAGE' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {fileName}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {fileType} Document &bull; {sections.length} Elements
            </span>
          </div>
        </div>

        {/* Page navigation & Zoom controls */}
        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-slate-700 dark:text-slate-300">
                {fileType === 'PPTX' ? `Slide ${currentPage} of ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span 
              onClick={handleResetZoom}
              className="text-[11px] font-mono font-bold px-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
              title="Click to reset zoom"
            >
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Canvas Layout */}
      <div className="p-6 bg-slate-100/60 dark:bg-slate-950/60 min-h-[400px] flex items-center justify-center overflow-auto">
        <div 
          className="w-full max-w-4xl transition-all duration-150"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {fileType === 'IMAGE' && imageBlobUrl ? (
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-center">
              <img src={imageBlobUrl} alt="Source document" className="max-h-[500px] mx-auto object-contain rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Source Document Sheet */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>SOURCE ({sourceLanguageName})</span>
                  {fileType === 'PPTX' && <span className="font-mono">Slide {currentPage}</span>}
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {displayedSections.map((sec) => (
                    <div key={sec.id} className={sec.type === 'heading' ? 'font-extrabold text-slate-900 dark:text-white text-base' : ''}>
                      {sec.originalText}
                    </div>
                  ))}
                </div>
              </div>

              {/* Translated Document Sheet */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 shadow-md space-y-4 ring-1 ring-brand-500/10">
                <div className="pb-3 border-b border-brand-100 dark:border-brand-950/60 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                  <span>TRANSLATION ({targetLanguageName})</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80">
                    Structure Verified
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                  {displayedSections.map((sec) => (
                    <div key={sec.id} className={sec.type === 'heading' ? 'font-extrabold text-brand-600 dark:text-brand-400 text-base' : 'font-medium'}>
                      {sec.translatedText || sec.originalText}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

    </div>
  );
};
