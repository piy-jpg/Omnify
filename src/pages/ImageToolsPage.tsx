import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Crop,
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  SunMedium,
  Contrast,
  RotateCw,
  Layers,
  Wand2,
  Film,
  ArrowRight,
  Palette,
  Maximize2,
  Check,
  Zap,
  Image as ImageIcon,
  Stamp,
  SlidersHorizontal,
  FlipHorizontal,
  FlipVertical,
  Type,
  FileCode,
  UserSquare2,
  Grid,
  Eye,
  Trash2,
  ShieldCheck,
  Copy,
  Scissors,
  Eraser,
  Smile,
  ShieldAlert,
  Pipette,
  Archive,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { formatBytes } from '../utils/formatters';
import {
  ImageFilterSettings,
  ImageTransformSettings,
  PassportIdSettings,
  CanvasStylerSettings,
  WatermarkSettings,
  ImageGridTile,
  MemeSettings,
  CensorRegion,
  FILTER_PRESETS,
  PASSPORT_STANDARDS,
  GRADIENT_PRESETS,
  buildFilterCssString,
  processImageOnCanvas,
  generatePassportPhotoSheet,
  convertImageFormat,
  splitImageIntoGrid,
  eraseBackgroundColor,
  bundleImageTilesZip,
  renderMemeImage,
  applyCensorRedactions
} from '../services/image/imageToolsEngine';

interface ImageToolsPageProps {
  onSelectTool: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  onOpenVideoFrameStudio?: () => void;
}

export type ImageStudioTab =
  | 'filters'
  | 'crop_resize'
  | 'grid_splitter'
  | 'bg_eraser'
  | 'passport_id'
  | 'canvas_mockup'
  | 'watermark'
  | 'meme_generator'
  | 'censor_redact'
  | 'converter';

export const ImageToolsPage: React.FC<ImageToolsPageProps> = ({
  onSelectTool,
  onFileConverted,
  onOpenVideoFrameStudio
}) => {
  // Active Sub-Tool Tab
  const [activeTab, setActiveTab] = useState<ImageStudioTab>('filters');

  // Image Source States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 1. Filter Settings
  const [filters, setFilters] = useState<ImageFilterSettings>({
    preset: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
    opacity: 100
  });

  // 2. Transform Settings
  const [transforms, setTransforms] = useState<ImageTransformSettings>({
    rotation: 0,
    flipH: false,
    flipV: false,
    aspectRatio: 'original',
    resizeMode: 'none',
    scalePercent: 100,
    customWidth: 1200,
    customHeight: 800,
    maintainAspectRatio: true
  });

  // 3. Grid Splitter Settings
  const [gridRows, setGridRows] = useState<number>(3);
  const [gridCols, setGridCols] = useState<number>(3);
  const [gridTiles, setGridTiles] = useState<ImageGridTile[]>([]);
  const [isSlicingGrid, setIsSlicingGrid] = useState<boolean>(false);

  // 4. Background Eraser Settings
  const [eraserTargetColor, setEraserTargetColor] = useState<string>('#ffffff');
  const [eraserTolerance, setEraserTolerance] = useState<number>(35);
  const [eraserFeather, setEraserFeather] = useState<number>(10);
  const [erasedResultUrl, setErasedResultUrl] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState<boolean>(false);

  // 5. Passport & ID Photo Settings
  const [passportSettings, setPassportSettings] = useState<PassportIdSettings>({
    standard: 'us_passport',
    sheetLayout: '2x2',
    includeCutBorders: true,
    backgroundColor: '#ffffff'
  });

  // 6. Canvas Mockup & Styler Settings
  const [canvasStyler, setCanvasStyler] = useState<CanvasStylerSettings>({
    padding: 30,
    borderRadius: 16,
    shadowIntensity: 'medium',
    backgroundType: 'gradient',
    solidColor: '#1e293b',
    gradientPreset: 'sunset'
  });

  // 7. Watermark Settings
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: false,
    type: 'text',
    text: 'CONFIDENTIAL',
    fontFamily: 'sans-serif',
    fontSize: 32,
    textColor: '#ffffff',
    opacity: 0.6,
    rotation: -30,
    position: 'tiled',
    logoScale: 0.3
  });

  // 8. Meme Generator Settings
  const [memeSettings, setMemeSettings] = useState<MemeSettings>({
    topText: 'WHEN YOUR CODE COMPILES',
    bottomText: 'ON THE VERY FIRST RUN',
    fontSize: 48,
    textColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 5
  });

  // 9. Censor & Redaction Settings
  const [censorRegions, setCensorRegions] = useState<CensorRegion[]>([
    { id: '1', xPercent: 35, yPercent: 40, wPercent: 30, hPercent: 20, mode: 'pixelate' }
  ]);

  // 10. Converter Output Settings
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [outputQuality, setOutputQuality] = useState<number>(0.92);

  // Processing & Export States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number>(0);
  const [showComparison, setShowComparison] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);

  // Load sample demo image if none provided
  useEffect(() => {
    if (!previewSrc) {
      loadSampleDemo();
    }
  }, []);

  const loadSampleDemo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);

      // Add modern geometric shapes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(600, 400, 240, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ConvertPro Studio', 600, 390);

      ctx.font = '24px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('High-Fidelity Multi-Tool Image Engine', 600, 440);

      const url = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewSrc(url);
      setImageDims({ width: 1200, height: 800 });
      setTransforms(prev => ({ ...prev, customWidth: 1200, customHeight: 800 }));
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    setProcessedUrl(null);
    setGridTiles([]);
    setErasedResultUrl(null);

    const img = new Image();
    img.onload = () => {
      setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      setTransforms(prev => ({
        ...prev,
        customWidth: img.naturalWidth,
        customHeight: img.naturalHeight
      }));
    };
    img.src = url;
  };

  const handleApplyPreset = (presetKey: string) => {
    const p = FILTER_PRESETS[presetKey];
    if (p) {
      setFilters(prev => ({ ...prev, ...p, preset: presetKey }));
    }
  };

  // Convert Hex color to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  // Execute Background Color Eraser
  const handleEraseBackground = async () => {
    if (!previewSrc) return;
    setIsErasing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = previewSrc;
      });

      const rgb = hexToRgb(eraserTargetColor);
      const res = await eraseBackgroundColor(img, rgb, eraserTolerance, eraserFeather);
      setErasedResultUrl(res.dataUrl);
      setProcessedUrl(res.dataUrl);
      setProcessedSize(res.blob.size);
      setIsErasing(false);
      confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
    } catch (err) {
      console.error('BG Eraser failed:', err);
      setIsErasing(false);
    }
  };

  // Execute Grid Tile Slicing
  const handleSliceGrid = async () => {
    if (!previewSrc) return;
    setIsSlicingGrid(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = previewSrc;
      });

      const tiles = await splitImageIntoGrid(img, gridRows, gridCols, outputFormat === 'image/png' ? 'image/png' : 'image/jpeg');
      setGridTiles(tiles);
      setIsSlicingGrid(false);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Grid slice failed:', err);
      setIsSlicingGrid(false);
    }
  };

  // Render & Export Processed Image
  const handleProcessImage = async () => {
    if (!previewSrc) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = previewSrc;
      });

      let resultBlob: Blob;
      let resultDataUrl: string;

      if (activeTab === 'passport_id') {
        const res = await generatePassportPhotoSheet(img, passportSettings);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      } else if (activeTab === 'meme_generator') {
        const res = await renderMemeImage(img, memeSettings);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      } else if (activeTab === 'censor_redact') {
        const res = await applyCensorRedactions(img, censorRegions);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      } else if (activeTab === 'bg_eraser') {
        const rgb = hexToRgb(eraserTargetColor);
        const res = await eraseBackgroundColor(img, rgb, eraserTolerance, eraserFeather);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      } else if (activeTab === 'converter') {
        const res = await convertImageFormat(img, outputFormat, outputQuality);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      } else {
        const res = await processImageOnCanvas(img, filters, transforms, canvasStyler, watermark);
        resultBlob = res.blob;
        resultDataUrl = res.dataUrl;
      }

      setProcessedUrl(resultDataUrl);
      setProcessedSize(resultBlob.size);
      setIsProcessing(false);
      confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });

      const newFile: FileItem = {
        id: `img-tool-${Date.now()}`,
        name: `Studio_${selectedFile?.name || 'Image'}_${activeTab}.${outputFormat === 'image/png' ? 'png' : 'jpg'}`,
        size: resultBlob.size,
        type: outputFormat,
        extension: outputFormat === 'image/png' ? 'PNG' : 'JPG',
        uploadedAt: 'Just now',
        status: 'ready',
        previewUrl: resultDataUrl
      };
      onFileConverted(newFile);
    } catch (err) {
      console.error('Image processing error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. STUDIO HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <Sliders className="w-3.5 h-3.5 text-blue-200" />
            <span>Universal Creative Image Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Color Grading, Grid Slicer & Creative Photo Tools
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Grade colors with cinematic LUT filters, slice Instagram grids, erase solid backgrounds, create official passport sheets, generate viral memes, and redact sensitive info 100% client-side.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/bmp,image/svg+xml,image/heic"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs hover:bg-white/90 shadow-md transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{selectedFile ? 'Change Image' : 'Upload Image'}</span>
          </button>
          
          <button
            onClick={loadSampleDemo}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Demo Asset</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLS NAVIGATION BAR */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'filters', label: 'Color & Filters', icon: Palette },
          { id: 'crop_resize', label: 'Crop & Resize', icon: Crop },
          { id: 'grid_splitter', label: 'Grid & Tile Slicer', icon: Grid, badge: 'HOT' },
          { id: 'bg_eraser', label: 'Background Eraser', icon: Eraser, badge: 'AI' },
          { id: 'passport_id', label: 'Passport & ID Sheets', icon: UserSquare2 },
          { id: 'canvas_mockup', label: 'Canvas & Mockup', icon: Layers },
          { id: 'watermark', label: 'Watermark', icon: Stamp },
          { id: 'meme_generator', label: 'Meme Generator', icon: Smile },
          { id: 'censor_redact', label: 'Privacy Redactor', icon: ShieldAlert },
          { id: 'converter', label: 'Format Converter', icon: FileCode }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ImageStudioTab);
                setProcessedUrl(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                  isActive ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE: PREVIEW & CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE CANVAS PREVIEW */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Live Studio Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {imageDims.width} × {imageDims.height} px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    showComparison
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {showComparison ? 'Showing Original' : 'Hold to Compare'}
                </button>
              </div>
            </div>

            {/* Preview Box with Dynamic Styles */}
            <div className={`relative min-h-[360px] max-h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 overflow-hidden ${
              activeTab === 'bg_eraser' ? 'bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:20px_20px] bg-slate-900' : 'bg-slate-950/90'
            }`}>
              {previewSrc && (
                <div
                  className="relative transition-all duration-200 max-h-full max-w-full flex items-center justify-center"
                  style={{
                    padding: `${activeTab === 'canvas_mockup' ? canvasStyler.padding : 0}px`,
                    background: activeTab === 'canvas_mockup' 
                      ? canvasStyler.backgroundType === 'gradient'
                        ? GRADIENT_PRESETS[canvasStyler.gradientPreset]?.css || '#1e293b'
                        : canvasStyler.solidColor
                      : 'transparent',
                    borderRadius: `${activeTab === 'canvas_mockup' ? canvasStyler.borderRadius : 0}px`
                  }}
                >
                  <img
                    ref={imgElementRef}
                    src={erasedResultUrl && activeTab === 'bg_eraser' ? erasedResultUrl : previewSrc}
                    alt="Preview"
                    style={{
                      filter: showComparison ? 'none' : buildFilterCssString(filters),
                      transform: showComparison
                        ? 'none'
                        : `rotate(${transforms.rotation}deg) scale(${transforms.flipH ? -1 : 1}, ${transforms.flipV ? -1 : 1})`,
                      borderRadius: `${activeTab === 'canvas_mockup' ? canvasStyler.borderRadius : 4}px`,
                      maxHeight: '440px'
                    }}
                    className="object-contain shadow-2xl transition-all duration-200"
                  />

                  {/* Grid Splitter Overlay Guides */}
                  {activeTab === 'grid_splitter' && (
                    <div className="absolute inset-0 pointer-events-none grid" style={{
                      gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                    }}>
                      {Array.from({ length: gridRows * gridCols }).map((_, i) => (
                        <div key={i} className="border border-white/60 bg-purple-500/10 flex items-center justify-center">
                          <span className="text-white bg-black/60 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meme Generator Overlay */}
                  {activeTab === 'meme_generator' && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 text-center">
                      <p className="font-extrabold text-white text-2xl uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{
                        textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                      }}>
                        {memeSettings.topText}
                      </p>
                      <p className="font-extrabold text-white text-2xl uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{
                        textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                      }}>
                        {memeSettings.bottomText}
                      </p>
                    </div>
                  )}

                  {/* Privacy Redactor Censor Boxes Overlay */}
                  {activeTab === 'censor_redact' && censorRegions.map(reg => (
                    <div
                      key={reg.id}
                      className="absolute border-2 border-dashed border-red-500 bg-red-500/20 backdrop-blur-md flex items-center justify-center pointer-events-none"
                      style={{
                        left: `${reg.xPercent}%`,
                        top: `${reg.yPercent}%`,
                        width: `${reg.wPercent}%`,
                        height: `${reg.hPercent}%`
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded">
                        {reg.mode}
                      </span>
                    </div>
                  ))}

                  {/* Watermark Overlay in live preview */}
                  {activeTab === 'watermark' && watermark.enabled && watermark.text && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 overflow-hidden">
                      <span
                        className="font-bold select-none text-center"
                        style={{
                          fontSize: `${watermark.fontSize}px`,
                          color: watermark.textColor,
                          opacity: watermark.opacity,
                          transform: `rotate(${watermark.rotation}deg)`
                        }}
                      >
                        {watermark.text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {selectedFile ? selectedFile.name : 'Sample Asset'} ({formatBytes(selectedFile?.size || 450000)})
              </span>

              {activeTab === 'grid_splitter' ? (
                <button
                  onClick={handleSliceGrid}
                  disabled={isSlicingGrid}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isSlicingGrid ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Slicing Tiles...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Slice Image into {gridRows * gridCols} Tiles</span>
                    </>
                  )}
                </button>
              ) : activeTab === 'bg_eraser' ? (
                <button
                  onClick={handleEraseBackground}
                  disabled={isErasing}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isErasing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Erasing Background...</span>
                    </>
                  ) : (
                    <>
                      <Eraser className="w-4 h-4" />
                      <span>Erase Color to Transparent PNG</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Apply & Render Studio Output</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Grid Slicer Output Tiles Grid */}
          {activeTab === 'grid_splitter' && gridTiles.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Generated Grid Tiles ({gridTiles.length} items)
                  </span>
                </div>
                <button
                  onClick={() => bundleImageTilesZip(gridTiles, `ConvertPro_Grid_${gridRows}x${gridCols}.zip`)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Download All as ZIP</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {gridTiles.map((tile) => (
                  <div key={tile.index} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2 group">
                    <img src={tile.dataUrl} alt={tile.fileName} className="w-full h-24 object-cover rounded-lg" />
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300">#{tile.index} (R{tile.row}C{tile.col})</span>
                      <a
                        href={tile.dataUrl}
                        download={tile.fileName}
                        className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 hover:bg-purple-200 transition-colors"
                        title="Download tile"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE SUB-TOOL CONFIGURATION PANELS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. COLOR GRADING & FILTERS TAB */}
          {activeTab === 'filters' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Cinematic Looks & Color Tuning</span>
                </h3>
                <button
                  onClick={() => handleApplyPreset('none')}
                  className="text-xs text-purple-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vibrant', label: 'Vibrant', desc: 'Vivid color boost' },
                  { id: 'cinematic', label: 'Cinematic', desc: 'Teal & gold tone' },
                  { id: 'vintage', label: 'Vintage', desc: 'Retro kodak film' },
                  { id: 'noir', label: 'Film Noir', desc: 'Moody black & white' },
                  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon pink & purple' },
                  { id: 'warm_sunset', label: 'Sunset', desc: 'Warm amber glow' },
                  { id: 'cold_arctic', label: 'Arctic', desc: 'Cool crisp tint' },
                  { id: 'hdr', label: 'HDR Pop', desc: 'High dynamic clarity' },
                  { id: 'none', label: 'Normal', desc: 'Zero grading' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      filters.preset === p.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="text-xs">{p.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{p.desc}</p>
                  </button>
                ))}
              </div>

              {/* Fine Sliders */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Brightness</span>
                    <span className="font-mono text-purple-600">{filters.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={filters.brightness}
                    onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Contrast</span>
                    <span className="font-mono text-purple-600">{filters.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={filters.contrast}
                    onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Saturation</span>
                    <span className="font-mono text-purple-600">{filters.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    value={filters.saturation}
                    onChange={(e) => setFilters(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Hue Rotation</span>
                    <span className="font-mono text-purple-600">{filters.hueRotate}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={filters.hueRotate}
                    onChange={(e) => setFilters(prev => ({ ...prev, hueRotate: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. CROP, ROTATE & RESIZE TAB */}
          {activeTab === 'crop_resize' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Crop className="w-4 h-4 text-purple-600" />
                <span>Aspect Ratio & Transform</span>
              </h3>

              {/* Aspect Ratio Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Aspect Ratio Preset</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { id: 'original', label: 'Original' },
                    { id: '1:1', label: '1:1 Square' },
                    { id: '4:5', label: '4:5 Portrait' },
                    { id: '9:16', label: '9:16 Story' },
                    { id: '16:9', label: '16:9 Cinema' },
                    { id: '4:3', label: '4:3 Standard' }
                  ].map(ar => (
                    <button
                      key={ar.id}
                      onClick={() => setTransforms(prev => ({ ...prev, aspectRatio: ar.id as any }))}
                      className={`py-2 rounded-xl border text-center ${
                        transforms.aspectRatio === ar.id
                          ? 'bg-purple-600 text-white border-purple-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotation & Flip */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400">Orientation Controls</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setTransforms(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center gap-1.5 font-semibold"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    onClick={() => setTransforms(prev => ({ ...prev, flipH: !prev.flipH }))}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold ${
                      transforms.flipH ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => setTransforms(prev => ({ ...prev, flipV: !prev.flipV }))}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold ${
                      transforms.flipV ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>
              </div>

              {/* Precision Dimensions */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400">Custom Dimensions (Width × Height)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={transforms.customWidth}
                    onChange={(e) => setTransforms(prev => ({
                      ...prev,
                      resizeMode: 'dimensions',
                      customWidth: parseInt(e.target.value) || 1200
                    }))}
                    className="flex-1 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-center"
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    value={transforms.customHeight}
                    onChange={(e) => setTransforms(prev => ({
                      ...prev,
                      resizeMode: 'dimensions',
                      customHeight: parseInt(e.target.value) || 800
                    }))}
                    className="flex-1 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. GRID & TILE SLICER TAB */}
          {activeTab === 'grid_splitter' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-600" />
                <span>Social Media Grid & Panorama Slicer</span>
              </h3>

              {/* Grid Templates */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Preset Grid Layouts</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { rows: 3, cols: 3, label: '3×3 Instagram Grid', desc: '9 square tiles' },
                    { rows: 1, cols: 3, label: '3×1 Panorama Carousel', desc: '3 seamless swipe tiles' },
                    { rows: 2, cols: 2, label: '2×2 Square Collage', desc: '4 quadrant tiles' },
                    { rows: 1, cols: 2, label: '2×1 Split Post', desc: '2 dual cards' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.label}
                      onClick={() => {
                        setGridRows(tmpl.rows);
                        setGridCols(tmpl.cols);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        gridRows === tmpl.rows && gridCols === tmpl.cols
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p>{tmpl.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{tmpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Grid Rows and Columns */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Rows (Horizontal cuts)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gridRows}
                    onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Columns (Vertical cuts)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gridCols}
                    onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border font-mono font-bold text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. BACKGROUND ERASER TAB */}
          {activeTab === 'bg_eraser' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Eraser className="w-4 h-4 text-purple-600" />
                <span>Chroma Key & Background Remover</span>
              </h3>

              {/* Target Color Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Target Background Color to Erase</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eraserTargetColor}
                    onChange={(e) => setEraserTargetColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    {['#ffffff', '#000000', '#00ff00', '#0000ff'].map(c => (
                      <button
                        key={c}
                        onClick={() => setEraserTargetColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          eraserTargetColor.toLowerCase() === c ? 'scale-110 ring-2 ring-purple-600' : 'opacity-80'
                        }`}
                        style={{ background: c }}
                        title={`Select ${c}`}
                      />
                    ))}
                    <span className="font-mono text-xs font-bold text-slate-500">{eraserTargetColor}</span>
                  </div>
                </div>
              </div>

              {/* Tolerance Slider */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Color Tolerance</span>
                    <span className="font-mono text-purple-600">{eraserTolerance}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={eraserTolerance}
                    onChange={(e) => setEraserTolerance(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Edge Feathering</span>
                    <span className="font-mono text-purple-600">{eraserFeather}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={eraserFeather}
                    onChange={(e) => setEraserFeather(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. PASSPORT & ID PHOTO MAKER TAB */}
          {activeTab === 'passport_id' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <UserSquare2 className="w-4 h-4 text-purple-600" />
                <span>Passport & ID Photo Sheet Builder</span>
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Standard ID Size</label>
                <div className="space-y-1.5">
                  {(Object.keys(PASSPORT_STANDARDS) as (keyof typeof PASSPORT_STANDARDS)[]).map(key => {
                    const std = PASSPORT_STANDARDS[key];
                    const isSelected = passportSettings.standard === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setPassportSettings(prev => ({ ...prev, standard: key }))}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs">{std.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{std.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Printable Grid Sheet Layout */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400">Printable Sheet Layout (4x6" Print)</label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: 'single', label: '1 Photo' },
                    { id: '2x2', label: '4 (2x2)' },
                    { id: '2x4', label: '8 (2x4)' },
                    { id: '3x3', label: '9 (3x3)' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setPassportSettings(prev => ({ ...prev, sheetLayout: layout.id as any }))}
                      className={`py-2 rounded-xl border text-center ${
                        passportSettings.sheetLayout === layout.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. SOCIAL MOCKUP & CANVAS STYLER */}
          {activeTab === 'canvas_mockup' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Social Media Mockup & Canvas Styler</span>
              </h3>

              {/* Gradients Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Gradient Canvas Backgrounds</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(GRADIENT_PRESETS).map(gKey => {
                    const g = GRADIENT_PRESETS[gKey];
                    const isSelected = canvasStyler.gradientPreset === gKey;

                    return (
                      <button
                        key={gKey}
                        onClick={() => setCanvasStyler(prev => ({ ...prev, backgroundType: 'gradient', gradientPreset: gKey }))}
                        className={`h-12 rounded-xl p-2 flex items-end justify-start text-[10px] font-bold text-white shadow-xs border transition-all ${
                          isSelected ? 'ring-2 ring-purple-600 scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: g.css }}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Padding & Rounded Sliders */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Canvas Frame Padding</span>
                    <span className="font-mono text-purple-600">{canvasStyler.padding}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={canvasStyler.padding}
                    onChange={(e) => setCanvasStyler(prev => ({ ...prev, padding: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Corner Rounding</span>
                    <span className="font-mono text-purple-600">{canvasStyler.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={canvasStyler.borderRadius}
                    onChange={(e) => setCanvasStyler(prev => ({ ...prev, borderRadius: Number(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. WATERMARK & PROTECT TAB */}
          {activeTab === 'watermark' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-purple-600" />
                  <span>Watermark & Copyright Protection</span>
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable</span>
                  <input
                    type="checkbox"
                    checked={watermark.enabled}
                    onChange={(e) => setWatermark(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded text-purple-600 accent-purple-600 w-4 h-4"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Watermark Text</label>
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) => setWatermark(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="e.g. DO NOT COPY / BRAND NAME"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Position Style</label>
                    <select
                      value={watermark.position}
                      onChange={(e) => setWatermark(prev => ({ ...prev, position: e.target.value as any }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white"
                    >
                      <option value="tiled">Security Tiled Repeat</option>
                      <option value="center">Center Stamp</option>
                      <option value="bottom-right">Bottom-Right Corner</option>
                      <option value="bottom-left">Bottom-Left Corner</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Opacity ({Math.round(watermark.opacity * 100)}%)</label>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={watermark.opacity}
                      onChange={(e) => setWatermark(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className="w-full mt-3 accent-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. MEME GENERATOR TAB */}
          {activeTab === 'meme_generator' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-600" />
                <span>Viral Meme & Caption Studio</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Top Punchline Text</label>
                  <input
                    type="text"
                    value={memeSettings.topText}
                    onChange={(e) => setMemeSettings(prev => ({ ...prev, topText: e.target.value }))}
                    placeholder="TOP TEXT..."
                    className="w-full mt-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border font-extrabold uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Bottom Punchline Text</label>
                  <input
                    type="text"
                    value={memeSettings.bottomText}
                    onChange={(e) => setMemeSettings(prev => ({ ...prev, bottomText: e.target.value }))}
                    placeholder="BOTTOM TEXT..."
                    className="w-full mt-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border font-extrabold uppercase text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Font Size</label>
                    <input
                      type="range"
                      min={24}
                      max={84}
                      value={memeSettings.fontSize}
                      onChange={(e) => setMemeSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                      className="w-full mt-2 accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Stroke Thickness</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={memeSettings.strokeWidth}
                      onChange={(e) => setMemeSettings(prev => ({ ...prev, strokeWidth: Number(e.target.value) }))}
                      className="w-full mt-2 accent-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. PRIVACY REDACTOR & CENSOR TAB */}
          {activeTab === 'censor_redact' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Privacy Censor & Redaction</span>
                </h3>
                <button
                  onClick={() => {
                    const newId = String(Date.now());
                    setCensorRegions(prev => [
                      ...prev,
                      { id: newId, xPercent: 20 + prev.length * 10, yPercent: 20 + prev.length * 10, wPercent: 25, hPercent: 15, mode: 'pixelate' }
                    ]);
                  }}
                  className="text-xs text-purple-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Box</span>
                </button>
              </div>

              <div className="space-y-3">
                {censorRegions.map((reg, idx) => (
                  <div key={reg.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Censor Box #{idx + 1}</span>
                      <button
                        onClick={() => setCensorRegions(prev => prev.filter(r => r.id !== reg.id))}
                        className="text-red-500 hover:text-red-600 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['pixelate', 'blur', 'blackout'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setCensorRegions(prev => prev.map(r => r.id === reg.id ? { ...r, mode } : r))}
                          className={`py-1.5 rounded-lg border text-center font-bold capitalize ${
                            reg.mode === mode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span>X Pos: {reg.xPercent}%</span>
                        <input
                          type="range"
                          min={0}
                          max={80}
                          value={reg.xPercent}
                          onChange={(e) => setCensorRegions(prev => prev.map(r => r.id === reg.id ? { ...r, xPercent: Number(e.target.value) } : r))}
                          className="w-full accent-purple-600"
                        />
                      </div>
                      <div>
                        <span>Y Pos: {reg.yPercent}%</span>
                        <input
                          type="range"
                          min={0}
                          max={80}
                          value={reg.yPercent}
                          onChange={(e) => setCensorRegions(prev => prev.map(r => r.id === reg.id ? { ...r, yPercent: Number(e.target.value) } : r))}
                          className="w-full accent-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. FORMAT CONVERTER TAB */}
          {activeTab === 'converter' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                <span>Multi-Format Export & Compression</span>
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Target Image Format</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'image/jpeg', label: 'JPG / JPEG', desc: 'Best compatibility' },
                    { id: 'image/png', label: 'PNG Lossless', desc: 'Crisp transparency' },
                    { id: 'image/webp', label: 'WebP Modern', desc: 'Ultra-small size' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setOutputFormat(f.id as any)}
                      className={`p-3 rounded-xl border text-left ${
                        outputFormat === f.id
                          ? 'bg-purple-600 text-white border-purple-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p>{f.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Compression Quality</span>
                  <span className="font-mono text-purple-600">{Math.round(outputQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={outputQuality}
                  onChange={(e) => setOutputQuality(parseFloat(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          )}

          {/* DOWNLOAD READY CARD */}
          {processedUrl && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Studio Render Complete ({formatBytes(processedSize)})
                  </span>
                </div>
                <a
                  href={processedUrl}
                  download={`ConvertPro_${activeTab}_output.${outputFormat === 'image/png' || activeTab === 'bg_eraser' ? 'png' : 'jpg'}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Output</span>
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
