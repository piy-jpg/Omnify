import React, { useState, useRef } from 'react';
import { 
  FileBox, 
  CopyPlus, 
  Scissors, 
  Minimize2, 
  RotateCw, 
  Stamp, 
  Lock, 
  Upload, 
  ArrowRight, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { ConverterEngine } from '../services/converterEngine';
import { formatBytes } from '../utils/formatters';

interface PdfToolsPageProps {
  onSelectTool: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  tools: ToolItem[];
}

export const PdfToolsPage: React.FC<PdfToolsPageProps> = ({
  onSelectTool,
  onFileConverted,
  tools
}) => {
  const [selectedAction, setSelectedAction] = useState<'compress' | 'rotate' | 'watermark' | 'split'>('compress');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [rotateDeg, setRotateDeg] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfTools = tools.filter(t => t.category === 'pdf-tools');

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const res = await ConverterEngine.processPDF(
        selectedFile,
        selectedAction,
        {
          watermarkText,
          rotateDegrees: rotateDeg as any
        }
      );

      setResult(res);
      setIsProcessing(false);
      confetti({ particleCount: 70, spread: 60 });

      const newFile: FileItem = {
        id: `pdf-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: 'application/pdf',
        extension: 'PDF',
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        previewUrl: res.previewUrl
      };
      onFileConverted(newFile);
    } catch (err) {
      setIsProcessing(false);
      alert('PDF processing failed.');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-brand-700 to-purple-800 text-white p-6 sm:p-8 shadow-lg shadow-indigo-900/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
            <FileBox className="w-3.5 h-3.5 text-indigo-200" />
            <span>PDF Master Suite</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Merge, Split, Rotate, Compress & Protect PDFs
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
            Complete binary PDF toolkit powered by client-side WebAssembly & pdf-lib. Instant operations without cloud storage retention.
          </p>
        </div>
      </div>

      {/* Interactive Quick PDF Action Lab */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Instant PDF Operation Lab
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose an action and drop your PDF to execute real-time modifications.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {[
              { id: 'compress', label: 'Compress', icon: Minimize2 },
              { id: 'rotate', label: 'Rotate', icon: RotateCw },
              { id: 'watermark', label: 'Watermark', icon: Stamp },
              { id: 'split', label: 'Split', icon: Scissors }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = selectedAction === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedAction(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/20 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Select or Drop PDF file to {selectedAction}
            </h3>
            <p className="text-xs text-slate-400">
              Supports single and multi-page PDF documents up to 500 MB
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  <FileBox className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)} &bull; Action: <span className="font-bold text-indigo-600 capitalize">{selectedAction}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>

            {/* Custom inputs per action */}
            {selectedAction === 'watermark' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Watermark Stamp Text:
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {selectedAction === 'rotate' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Rotation Angle:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[90, 180, 270].map(deg => (
                    <button
                      key={deg}
                      onClick={() => setRotateDeg(deg)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        rotateDeg === deg ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {deg}° Clockwise
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!result ? (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isProcessing ? 'Processing PDF Streams...' : `Execute ${selectedAction.toUpperCase()}`}</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    PDF Successfully Modified!
                  </span>
                  <span>{formatBytes(result.convertedSize)}</span>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {result.downloadName}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Grid of All PDF Tools */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          All PDF Tools ({pdfTools.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfTools.map(tool => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileBox className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tool.description}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
