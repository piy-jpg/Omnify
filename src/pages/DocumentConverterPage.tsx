import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  FileSpreadsheet, 
  Presentation, 
  ArrowRight, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  Table,
  Layers,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { ConverterEngine } from '../services/converterEngine';
import { formatBytes } from '../utils/formatters';

interface DocumentConverterPageProps {
  onSelectTool: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  tools: ToolItem[];
}

export const DocumentConverterPage: React.FC<DocumentConverterPageProps> = ({
  onSelectTool,
  onFileConverted,
  tools
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetExt, setTargetExt] = useState<'docx' | 'xlsx' | 'pdf' | 'pptx'>('docx');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docTools = tools.filter(t => t.category === 'document-converter');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      let toolId = `pdf-to-${targetExt}`;
      if (selectedFile.name.endsWith('.docx')) toolId = 'docx-to-pdf';
      if (selectedFile.name.endsWith('.txt')) toolId = 'txt-to-pdf';

      const res = await ConverterEngine.convertFile(selectedFile, toolId);
      setResult(res);
      setIsProcessing(false);
      confetti({ particleCount: 70, spread: 60 });

      const newFile: FileItem = {
        id: `doc-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: res.mimeType,
        extension: targetExt.toUpperCase(),
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        previewUrl: res.previewUrl
      };
      onFileConverted(newFile);
    } catch (err) {
      setIsProcessing(false);
      alert('Document conversion failed.');
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-700 text-white p-6 sm:p-8 shadow-lg shadow-blue-900/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
            <FileText className="w-3.5 h-3.5 text-blue-200" />
            <span>Document Conversion Suite</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Universal Office & PDF Format Transforms
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Convert PDFs to editable Microsoft Word (.docx), Excel spreadsheets (.xlsx), and PowerPoint slides with 100% typography and structure preservation.
          </p>
        </div>
      </div>

      {/* Interactive Quick Document Converter */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            High-Fidelity Document Transformer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preserves font families, cell layouts, margins, and inline vectors.
          </p>
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/20 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.xlsx,.pptx,.txt"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Select or Drop PDF / DOCX / PPTX / XLSX file
            </h3>
            <p className="text-xs text-slate-400">
              Supports files up to 500 MB with instant client & GPU processing
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)} &bull; Ready for transformation</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Change File
              </button>
            </div>

            {/* Target format picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Select Target Format:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'docx', label: 'Word (DOCX)', icon: FileText, desc: 'Editable Text' },
                  { id: 'xlsx', label: 'Excel (XLSX)', icon: Table, desc: 'Data Tables' },
                  { id: 'pptx', label: 'PowerPoint (PPTX)', icon: Presentation, desc: 'Slide Decks' },
                  { id: 'pdf', label: 'PDF Document', icon: FileCheck, desc: 'Vector Layout' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = targetExt === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTargetExt(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Convert action */}
            {!result ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isProcessing ? 'Converting Layout & Typography...' : `Convert to ${targetExt.toUpperCase()}`}</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Document Converted Successfully!
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

      {/* Grid of All Document Tools */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Document Tools Catalogue ({docTools.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docTools.map(tool => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tool.description}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
