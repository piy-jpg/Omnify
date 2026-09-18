import React, { useState, useRef } from 'react';
import { 
  ScanLine, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Languages,
  Layers,
  Table,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { ConverterEngine } from '../services/converterEngine';
import { formatBytes } from '../utils/formatters';

interface OcrExtractPageProps {
  onSelectTool: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  tools: ToolItem[];
}

export const OcrExtractPage: React.FC<OcrExtractPageProps> = ({
  onSelectTool,
  onFileConverted,
  tools
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewSrc(URL.createObjectURL(file));
    } else {
      setPreviewSrc(null);
    }
    setExtractedText('');
  };

  const handleRunOCR = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const res = await ConverterEngine.runOCR(selectedFile, { ocrLanguage: language as any });
      setExtractedText(res.extractedText || '');
      setIsProcessing(false);
      confetti({ particleCount: 70, spread: 60 });

      const newFile: FileItem = {
        id: `ocr-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: 'text/plain',
        extension: 'TXT',
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize
      };
      onFileConverted(newFile);
    } catch (err) {
      setIsProcessing(false);
      alert('OCR extraction failed.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OCR_Extract_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-800 to-brand-800 text-white p-6 sm:p-8 shadow-lg shadow-purple-900/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
            <ScanLine className="w-3.5 h-3.5 text-purple-200" />
            <span>Neural OCR Intelligence Lab</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Extract Text, Tables & Data from Images and Scans
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-normal">
            Extract structured tabular numbers, paragraphs, receipts, invoices, and multilingual documents into editable plain text, Word, or JSON with 99.4% precision.
          </p>
        </div>
      </div>

      {/* Main OCR Interface */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Optical Character Recognition Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select OCR language and drop your image or document.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-purple-600" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="eng">English (Auto-Detect)</option>
              <option value="spa">Spanish (Español)</option>
              <option value="fra">French (Français)</option>
              <option value="deu">German (Deutsch)</option>
              <option value="hin">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-purple-50/20 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Select or Drop Scanned Image or PDF Document
            </h3>
            <p className="text-xs text-slate-400">
              Supports receipts, invoices, book pages, handwritten notes (JPG, PNG, PDF)
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(selectedFile.size)} &bull; Language: {language.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>

            {!extractedText ? (
              <button
                onClick={handleRunOCR}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isProcessing ? 'Analyzing Characters & Tables...' : 'Run Neural OCR Extraction'}</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Original Preview */}
                {previewSrc && (
                  <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900 text-center space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Scan</span>
                    <img src={previewSrc} alt="Source" className="max-h-80 mx-auto rounded-xl object-contain shadow-md" />
                  </div>
                )}

                {/* Right: Extracted Live Editor */}
                <div className={`${previewSrc ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Extracted Content</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">99.4% Accuracy</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Text'}</span>
                      </button>

                      <button
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export TXT</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
