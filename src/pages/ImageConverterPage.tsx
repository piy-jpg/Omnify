import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Sliders, 
  ArrowRight, 
  Sparkles, 
  Download, 
  Layers, 
  CheckCircle2, 
  Maximize2,
  RefreshCw,
  FileImage,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { ConverterEngine } from '../services/converterEngine';
import { formatBytes } from '../utils/formatters';

interface ImageConverterPageProps {
  onSelectTool: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  tools: ToolItem[];
}

export const ImageConverterPage: React.FC<ImageConverterPageProps> = ({
  onSelectTool,
  onFileConverted,
  tools
}) => {
  const [activeTab, setActiveTab] = useState<'convert' | 'compress' | 'resize'>('convert');
  
  // Direct Quick Converter State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedResult, setConvertedResult] = useState<any>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageTools = tools.filter(t => t.category === 'image-converter' || t.category === 'image-tools');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    setConvertedResult(null);
  };

  const handleConvertNow = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const res = await ConverterEngine.convertImage(
        selectedFile,
        targetFormat,
        {
          imageQuality: quality > 80 ? 'high' : quality > 50 ? 'medium' : 'low',
        }
      );

      setConvertedResult(res);
      setIsProcessing(false);
      confetti({ particleCount: 70, spread: 60 });

      const newFile: FileItem = {
        id: `img-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: res.mimeType,
        extension: targetFormat.toUpperCase(),
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        previewUrl: res.previewUrl
      };
      onFileConverted(newFile);
    } catch (err) {
      setIsProcessing(false);
      alert('Image conversion error. Please check file format.');
    }
  };

  const handleDownload = () => {
    if (!convertedResult) return;
    const a = document.createElement('a');
    a.href = convertedResult.previewUrl || URL.createObjectURL(convertedResult.blob);
    a.download = convertedResult.downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-600 to-brand-600 text-white p-6 sm:p-8 shadow-lg shadow-purple-900/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
            <ImageIcon className="w-3.5 h-3.5 text-purple-200" />
            <span>Image Studio & Converter</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Transform, Optimize & Compress Any Image Format
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-normal">
            Convert JPG, PNG, WEBP, HEIC, and BMP with lossless quality or target compression. All processed client-side with 100% privacy guarantee.
          </p>
        </div>
      </div>

      {/* Interactive Quick Image Converter Studio */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Instant Image Transformation Studio</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select or drop an image below to configure target format and compression.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('convert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'convert' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Format Switch
            </button>
            <button
              onClick={() => setActiveTab('compress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compress' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Compress
            </button>
          </div>
        </div>

        {/* Dropzone or Preview */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-brand-50/20 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Click to select or drag & drop an image here
            </h3>
            <p className="text-xs text-slate-400">
              Supports JPG, PNG, WEBP, HEIC, GIF, BMP (Max 100 MB)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left: Image preview & dimensions */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="max-h-52 mx-auto rounded-xl object-contain shadow-sm"
                />
              )}
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                <p className="text-slate-400 text-[11px]">{formatBytes(selectedFile.size)} &bull; {selectedFile.type}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Choose Different File
              </button>
            </div>

            {/* Right: Format & Quality Controls */}
            <div className="md:col-span-7 space-y-5">
              
              {/* Target Format selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Target Format:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['png', 'jpg', 'webp', 'pdf'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all ${
                        targetFormat === fmt
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Compression & Quality:</span>
                  <span className="text-brand-600 dark:text-brand-400 font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Smallest Size (50%)</span>
                  <span>Balanced (75%)</span>
                  <span>Max Fidelity (100%)</span>
                </div>
              </div>

              {/* Action & Result */}
              {!convertedResult ? (
                <button
                  onClick={handleConvertNow}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isProcessing ? 'Processing Image...' : `Convert to ${targetFormat.toUpperCase()}`}</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Image Converted Successfully!
                    </span>
                    <span>{formatBytes(convertedResult.convertedSize)}</span>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {convertedResult.downloadName}</span>
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* Grid of All Image Tools */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          All Image Tools ({imageTools.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imageTools.map(tool => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tool.description}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
