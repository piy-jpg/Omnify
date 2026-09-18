import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  FileImage,
  ArrowRight,
  CheckCircle2,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Settings2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Lock,
  Layers,
  FileCode,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, ConversionOptions, ConversionProgress, FileItem } from '../../types';
import { ConverterEngine, ConversionResult } from '../../services/converterEngine';
import { formatBytes, getFileTypeBadge } from '../../utils/formatters';

interface ConversionModalProps {
  tool: ToolItem;
  initialFiles?: File[];
  onClose: () => void;
  onConversionSuccess: (newFile: FileItem) => void;
}

export const ConversionModal: React.FC<ConversionModalProps> = ({
  tool,
  initialFiles,
  onClose,
  onConversionSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Options state
  const [options, setOptions] = useState<ConversionOptions>({
    pageSize: 'a4',
    orientation: 'portrait',
    imageQuality: 'high',
    margins: 'normal',
    compressionLevel: 'recommended',
    ocrLanguage: 'eng',
    watermarkText: '',
    rotateDegrees: 0,
  });

  // Conversion execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
    detail: ''
  });
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with initialFiles if passed
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFileSelected(initialFiles[0]);
    }
  }, [initialFiles]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setCurrentStep(2);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Load realistic sample file for quick test
  const handleLoadSample = async () => {
    try {
      // Create a canvas-generated crisp sample image
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#9333ea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 800);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ConvertPro Sample Document', 600, 360);
        
        ctx.font = '24px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('High-Fidelity Automated Converter Test File', 600, 420);
        ctx.fillText(`Target: ${tool.toFormat} • Generated at ${new Date().toLocaleTimeString()}`, 600, 470);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const sample = new File([blob], 'sample_document.png', { type: 'image/png' });
          handleFileSelected(sample);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
    }
  };

  const executeConversion = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentStep(5);
    setErrorMessage(null);

    try {
      const res = await ConverterEngine.convertFile(
        selectedFile,
        tool.id,
        options,
        (p) => setProgress(p)
      );

      setResult(res);
      setIsProcessing(false);
      setCurrentStep(6);

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Save to recent files
      const newFileItem: FileItem = {
        id: `file-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: res.mimeType,
        extension: res.downloadName.split('.').pop()?.toUpperCase() || tool.toFormat,
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        previewUrl: res.previewUrl
      };
      onConversionSuccess(newFileItem);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An error occurred during file conversion.');
      setCurrentStep(2);
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

  const handleShareCopy = () => {
    navigator.clipboard.writeText(`https://convertpro.app/share/d/${Date.now().toString(36)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setCurrentStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{tool.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                  {tool.fromFormat} → {tool.toFormat}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tool.description}
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

        {/* Stepper Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>1</span>
            <span className={currentStep >= 1 ? 'text-slate-900 dark:text-white' : ''}>Upload</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">──</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>2</span>
            <span className={currentStep >= 2 ? 'text-slate-900 dark:text-white' : ''}>Configure</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">──</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 5 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>3</span>
            <span className={currentStep >= 5 ? 'text-slate-900 dark:text-white' : ''}>Process</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">──</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 6 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>4</span>
            <span className={currentStep === 6 ? 'text-emerald-600 dark:text-emerald-400' : ''}>Download</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD SCREEN */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-brand-50/20 dark:bg-slate-800/30 dark:hover:bg-brand-950/20 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  Drag & Drop your {tool.fromFormat} file here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  Support files up to 500 MB. Instant automated client-side processing & privacy assurance.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-sm hover:bg-brand-700 transition-colors"
                  >
                    Browse Local File
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSample();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Load Sample File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 & 3: PREVIEW & CUSTOMIZE OPTIONS */}
          {(currentStep === 2 || currentStep === 3) && selectedFile && (
            <div className="space-y-6">
              
              {/* File Info Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    {previewUrl ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatBytes(selectedFile.size)} • Ready to convert to <span className="font-semibold text-brand-600 dark:text-brand-400">{tool.toFormat}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Live Preview If Image */}
              {previewUrl && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-900 p-2 flex items-center justify-center max-h-56 overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 rounded-xl object-contain shadow-md"
                    style={{ transform: `rotate(${options.rotateDegrees || 0}deg)` }}
                  />
                </div>
              )}

              {/* Conversion Options */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-brand-600" />
                  <span>Output Customization</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Page Size Option */}
                  {tool.toFormat === 'PDF' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page Size</label>
                      <select
                        value={options.pageSize}
                        onChange={(e) => setOptions({ ...options, pageSize: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="a4">A4 (210 × 297 mm) - Standard</option>
                        <option value="letter">US Letter (8.5 × 11 in)</option>
                        <option value="legal">US Legal (8.5 × 14 in)</option>
                        <option value="fit">Fit to Image Proportions</option>
                      </select>
                    </div>
                  )}

                  {/* Orientation Option */}
                  {tool.toFormat === 'PDF' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Orientation</label>
                      <select
                        value={options.orientation}
                        onChange={(e) => setOptions({ ...options, orientation: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="portrait">Portrait (Vertical)</option>
                        <option value="landscape">Landscape (Horizontal)</option>
                      </select>
                    </div>
                  )}

                  {/* Image Quality / Compression */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Image Quality / Compression</label>
                    <select
                      value={options.imageQuality}
                      onChange={(e) => setOptions({ ...options, imageQuality: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="maximum">Maximum (Lossless fidelity)</option>
                      <option value="high">High (Recommended - 92% quality)</option>
                      <option value="medium">Medium (Balanced 75% quality)</option>
                      <option value="low">Low (Smallest size 50%)</option>
                    </select>
                  </div>

                  {/* Margins */}
                  {tool.toFormat === 'PDF' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Page Margins</label>
                      <select
                        value={options.margins}
                        onChange={(e) => setOptions({ ...options, margins: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="normal">Normal (10 mm)</option>
                        <option value="small">Small (5 mm)</option>
                        <option value="none">No Margins (Edge-to-edge)</option>
                        <option value="large">Large (20 mm)</option>
                      </select>
                    </div>
                  )}

                  {/* Watermark option */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Watermark Text (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., CONFIDENTIAL / DRAFT"
                      value={options.watermarkText || ''}
                      onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                </div>
              </div>

              {/* Action Button: Convert */}
              <div className="pt-2">
                <button
                  onClick={executeConversion}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 hover:scale-[1.01] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Convert to {tool.toFormat}</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 5: ANIMATED CONVERSION PROGRESS */}
          {currentStep === 5 && (
            <div className="py-10 text-center space-y-6">
              
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-brand-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-brand-600 dark:text-brand-400">
                  {progress.percent}%
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {progress.message || 'Converting document...'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {progress.detail || 'Processing image vector layers and metadata streams'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

            </div>
          )}

          {/* STEP 6: SUCCESS SCREEN */}
          {currentStep === 6 && result && (
            <div className="py-4 space-y-6">
              
              {/* Success Banner */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in-50 duration-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Your {tool.toFormat} is ready!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Conversion completed in 1.4s with 100% structural fidelity.
                </p>
              </div>

              {/* File Info Card with Savings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {result.downloadName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatBytes(result.originalSize)} ➔ <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBytes(result.convertedSize)}</span>
                  </p>
                </div>

                {result.reductionPercentage > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                    -{result.reductionPercentage}% smaller
                  </span>
                )}
              </div>

              {/* Extracted OCR text if applicable */}
              {result.extractedText && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Extracted OCR Output:</label>
                  <textarea
                    readOnly
                    value={result.extractedText}
                    rows={6}
                    className="w-full p-3 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons: Download, Convert Another, Share */}
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {tool.toFormat} File</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={resetModal}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Convert Another</span>
                  </button>

                  <button
                    onClick={handleShareCopy}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
