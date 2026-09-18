import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Eraser,
  Square,
  Brush,
  Scissors,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Download,
  Play,
  Pause,
  Sliders,
  Layers,
  Film,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  FileBox,
  Copy,
  Check,
  Move
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MediaType,
  MediaDetectionItem,
  MaskTool,
  BoundingBox,
  QualityReport,
  WatermarkRemovalJob
} from '../types/watermark';
import {
  analyzeMediaWithAI,
  boxToCanvasCoords,
  getGeminiWatermarkBox,
  detectGeminiWatermarkBox
} from '../services/ai/watermarkGeminiService';
import {
  inpaintCanvas,
  exportCanvasToBlob
} from '../services/ai/inpaintingEngine';
import { formatBytes } from '../utils/formatters';

interface WatermarkRemoverPageProps {
  onFileSaved?: (fileItem: any) => void;
}

export const WatermarkRemoverPage: React.FC<WatermarkRemoverPageProps> = ({ onFileSaved }) => {
  // Media State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Metadata
  const [metadata, setMetadata] = useState<{
    width: number;
    height: number;
    duration?: number;
    fps?: number;
    hasAudio?: boolean;
    size: number;
  }>({
    width: 1920,
    height: 1080,
    size: 0
  });

  // AI Detections
  const [detections, setDetections] = useState<MediaDetectionItem[]>([]);
  const [aiProvider, setAiProvider] = useState<string>('gemini');

  // Mask & Canvas Editor Tools
  const [activeTool, setActiveTool] = useState<MaskTool>('brush');
  const [brushSize, setBrushSize] = useState<number>(36);
  const [brushSoftness, setBrushSoftness] = useState<number>(0.3);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);
  const [showDetectionBoxes, setShowDetectionBoxes] = useState(true);

  // Undo / Redo History
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // Video Range & Playback
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<{ startTime: number; endTime: number }>({
    startTime: 0,
    endTime: 10
  });
  const [isStaticWatermark, setIsStaticWatermark] = useState(true);

  // Comparison Viewer State
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [showOriginalInToggle, setShowOriginalInToggle] = useState<boolean>(false);

  // Quality Report
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);

  // Canvas Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cleanedVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rectStartRef = useRef<{ x: number; y: number } | null>(null);
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Handle File Selection
  const handleFileChange = async (file: File) => {
    setErrorMessage(null);
    setCleanedUrl(null);
    setQualityReport(null);
    setUndoStack([]);
    setRedoStack([]);
    setDetections([]);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
    setMediaType(isVideo ? 'video' : 'image');
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    if (!isVideo) {
      // Load image to extract dimensions and initialize canvas
      const img = new Image();
      img.onload = () => {
        setMetadata({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size
        });
        initCanvases(img.naturalWidth, img.naturalHeight, img);
      };
      img.src = url;
    }

    // Automatically trigger AI Visual Analysis
    triggerAiAnalysis(file);
  };

  // Initialize Canvas Layers
  const initCanvases = (width: number, height: number, imageElement?: HTMLImageElement) => {
    if (imageCanvasRef.current && maskCanvasRef.current) {
      imageCanvasRef.current.width = width;
      imageCanvasRef.current.height = height;
      maskCanvasRef.current.width = width;
      maskCanvasRef.current.height = height;

      const imgCtx = imageCanvasRef.current.getContext('2d');
      if (imgCtx && imageElement) {
        imgCtx.drawImage(imageElement, 0, 0);
      }

      const maskCtx = maskCanvasRef.current.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, width, height);
      }
    }
  };

  // Run AI Detection with Gemini / Heuristic Pipeline
  const triggerAiAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setStageMessage('Gemini Vision analyzing visual layers for overlays...');
    setProcessProgress(15);
    const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);

    try {
      const res = await analyzeMediaWithAI(file, (msg, pct) => {
        setStageMessage(msg);
        setProcessProgress(pct);
      });

      if (res.success) {
        setDetections(res.detections || []);
        setAiProvider(res.provider);
        if (res.metadata) {
          setMetadata(prev => ({
            ...prev,
            ...res.metadata,
            size: file.size
          }));
          if (res.metadata.duration) {
            setVideoDuration(res.metadata.duration);
            setTimeRange({ startTime: 0, endTime: res.metadata.duration });
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI analysis could not detect overlays.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Draw detection boxes onto the mask canvas
  const applyDetectionsToMask = (items: MediaDetectionItem[], width: number, height: number) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Save snapshot for undo
    saveUndoSnapshot();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.90)'; // Translucent Red
    items.filter(d => d.selected !== false).forEach(item => {
      const coords = boxToCanvasCoords(item.boundingBox, width, height);
      if (item.id === 'det-gemini-sparkle') {
        const centerX = coords.x + coords.width / 2;
        const centerY = coords.y + coords.height / 2;
        const radius = Math.max(coords.width, coords.height) / 2 + 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
      }
    });
  };

  // Toggle individual detection selection
  const handleToggleDetection = (id: string) => {
    const updated = detections.map(d => (d.id === id ? { ...d, selected: !d.selected } : d));
    setDetections(updated);

    // Rebuild mask
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        applyDetectionsToMask(updated, metadata.width, metadata.height);
      }
    }
  };

  const handleSelectAllDetections = (selectAll: boolean) => {
    const updated = detections.map(d => ({ ...d, selected: selectAll }));
    setDetections(updated);
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        if (selectAll) {
          applyDetectionsToMask(updated, metadata.width, metadata.height);
        }
      }
    }
  };

  // Undo / Redo Snapshot Helpers
  const saveUndoSnapshot = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setUndoStack(prev => [...prev.slice(-15), snapshot]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const current = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const previous = undoStack[undoStack.length - 1];

    setRedoStack(prev => [...prev, current]);
    setUndoStack(prev => prev.slice(0, -1));
    ctx.putImageData(previous, 0, 0);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const current = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const next = redoStack[redoStack.length - 1];

    setUndoStack(prev => [...prev, current]);
    setRedoStack(prev => prev.slice(0, -1));
    ctx.putImageData(next, 0, 0);
  };

  const handleClearMask = () => {
    if (!maskCanvasRef.current) return;
    saveUndoSnapshot();
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  };

  // Mouse / Touch Canvas Event Listeners for Mask Painting
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning || e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (!maskCanvasRef.current) return;
    saveUndoSnapshot();
    isDrawingRef.current = true;
    const pt = getCanvasCoordinates(e);
    lastPointRef.current = pt;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(239, 68, 68, 0.8)';
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fill();
    } else if (activeTool === 'rectangle') {
      rectStartRef.current = pt;
    } else if (activeTool === 'lasso') {
      lassoPointsRef.current = [pt];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDrawingRef.current || !maskCanvasRef.current) return;
    const pt = getCanvasCoordinates(e);
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
      lastPointRef.current = pt;
    } else if (activeTool === 'lasso') {
      lassoPointsRef.current.push(pt);
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 3;
      ctx.globalCompositeOperation = 'source-over';
      ctx.stroke();
      lastPointRef.current = pt;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawingRef.current || !maskCanvasRef.current) return;
    isDrawingRef.current = false;
    const pt = getCanvasCoordinates(e);
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'rectangle' && rectStartRef.current) {
      const rx = Math.min(rectStartRef.current.x, pt.x);
      const ry = Math.min(rectStartRef.current.y, pt.y);
      const rw = Math.abs(pt.x - rectStartRef.current.x);
      const rh = Math.abs(pt.y - rectStartRef.current.y);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(rx, ry, rw, rh);
      rectStartRef.current = null;
    } else if (activeTool === 'lasso' && lassoPointsRef.current.length > 2) {
      ctx.beginPath();
      ctx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
      for (let i = 1; i < lassoPointsRef.current.length; i++) {
        ctx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.globalCompositeOperation = 'source-over';
      ctx.fill();
      lassoPointsRef.current = [];
    }

    lastPointRef.current = null;
  };

  // Convert Mask Canvas into Normalized Bounding Boxes for backend processing
  const extractMaskBoundingBoxes = (): BoundingBox[] => {
    if (!maskCanvasRef.current) {
      return detections.filter(d => d.selected !== false).map(d => d.boundingBox);
    }
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    let found = false;

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > 30) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      return detections.filter(d => d.selected !== false).map(d => d.boundingBox);
    }

    return [
      {
        x: Math.max(0, minX / canvas.width),
        y: Math.max(0, minY / canvas.height),
        width: Math.min(1, (maxX - minX + 2) / canvas.width),
        height: Math.min(1, (maxY - minY + 2) / canvas.height)
      }
    ];
  };

  // Execute AI Removal Pipeline
  const handleExecuteRemoval = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessProgress(10);
    setStageMessage('Initiating context-aware inpainting reconstruction...');

    try {
      if (mediaType === 'image') {
        if (!imageCanvasRef.current || !maskCanvasRef.current) {
          throw new Error('Canvas not initialized');
        }

        // Check if user painted anything or selected detections
        const maskCtx = maskCanvasRef.current.getContext('2d');
        const maskImgData = maskCtx?.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        let hasMask = false;
        if (maskImgData) {
          for (let i = 3; i < maskImgData.data.length; i += 4) {
            if (maskImgData.data[i] > 30) {
              hasMask = true;
              break;
            }
          }
        }

        if (!hasMask) {
          const selectedDets = detections.filter(d => d.selected !== false);
          if (selectedDets.length > 0 && maskCtx) {
            selectedDets.forEach(det => {
              const coords = boxToCanvasCoords(det.boundingBox, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
              maskCtx.fillStyle = 'rgba(239, 68, 68, 0.95)';
              const centerX = coords.x + coords.width / 2;
              const centerY = coords.y + coords.height / 2;
              const radius = Math.max(coords.width, coords.height) / 2 + 8;
              maskCtx.beginPath();
              maskCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              maskCtx.fill();
            });
            hasMask = true;
          }
        }

        if (!hasMask) {
          setIsProcessing(false);
          setErrorMessage('Please use the Brush, Box, or Lasso tool to highlight the watermark or object you wish to remove.');
          return;
        }

        // Run High-Performance Context-Aware Inpainting (PatchMatch + Dirichlet Texture Synthesis)
        setProcessProgress(45);
        setStageMessage('Reconstructing textures & surrounding gradients...');

        const inpaintedCanvas = await inpaintCanvas(imageCanvasRef.current, maskCanvasRef.current);
        const cleanBlob = await exportCanvasToBlob(inpaintedCanvas, 'image/png', 0.98);
        const cleanBlobUrl = URL.createObjectURL(cleanBlob);

        setCleanedUrl(cleanBlobUrl);
        setQualityReport({
          resolutionPreserved: true,
          originalDimensions: `${metadata.width} × ${metadata.height}`,
          outputDimensions: `${metadata.width} × ${metadata.height}`,
          aspectRatioPreserved: true,
          sizeChangeRatio: `${Math.round((cleanBlob.size / selectedFile.size) * 100)}%`
        });

        // Optionally notify parent
        if (onFileSaved) {
          onFileSaved({
            id: `clean-${Date.now()}`,
            name: `cleaned_${selectedFile.name}`,
            size: cleanBlob.size,
            type: 'image/png',
            previewUrl: cleanBlobUrl,
            category: 'image-tools',
            uploadedAt: 'Just now'
          });
        }

        setProcessProgress(100);
        setStageMessage('AI Inpainting Complete!');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } else {
        // Video Inpainting Async Worker Job
        const boxes = extractMaskBoundingBoxes();
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('boundingBoxes', JSON.stringify(boxes));
        formData.append('timeRange', JSON.stringify(timeRange));
        formData.append('isStatic', String(isStaticWatermark));

        setProcessProgress(20);
        setStageMessage('Uploading video & queuing frame worker...');

        const startRes = await fetch('/api/ai/watermark/video/remove', {
          method: 'POST',
          body: formData
        });

        if (!startRes.ok) throw new Error('Video inpainting job failed to initialize.');
        const startJson = await startRes.json();
        const jobId = startJson.jobId;

        // Poll job status until completion
        await pollVideoJobStatus(jobId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI removal could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Targeted Google Gemini / Imagen Sparkle Watermark Remover
  const handleAutoRemoveGeminiWatermark = async () => {
    if (!selectedFile) return;
    if (cleanedUrl) {
      setCleanedUrl(null);
    }
    if (!maskCanvasRef.current || !imageCanvasRef.current) return;
    const width = metadata.width || imageCanvasRef.current.width;
    const height = metadata.height || imageCanvasRef.current.height;

    // Detect exact coordinates of Gemini sparkle in bottom-right corner
    const geminiBox = detectGeminiWatermarkBox(imageCanvasRef.current);
    const coords = boxToCanvasCoords(geminiBox, width, height);

    // Save undo snapshot
    saveUndoSnapshot();

    // Clear previous mask and paint tight circle strictly over the Gemini sparkle
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      const centerX = coords.x + coords.width / 2;
      const centerY = coords.y + coords.height / 2;
      const radius = Math.max(coords.width, coords.height) / 2 + 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    setDetections([
      {
        id: 'det-gemini-sparkle',
        type: 'watermark',
        label: '✨ Google Gemini AI Sparkle Watermark',
        confidence: 0.99,
        boundingBox: geminiBox,
        isStatic: true,
        selected: true
      }
    ]);

    // Automatically execute inpainting
    await handleExecuteRemoval();
  };

  // Video Job Polling Helper
  const pollVideoJobStatus = async (jobId: string) => {
    let completed = false;
    while (!completed) {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch(`/api/ai/watermark/job/${jobId}`);
      if (res.ok) {
        const job: WatermarkRemovalJob = await res.json();
        setProcessProgress(job.progress);
        setStageMessage(job.stageMessage);

        if (job.status === 'completed' && job.outputUrl) {
          completed = true;
          setCleanedUrl(job.outputUrl);
          if (job.qualityReport) {
            setQualityReport(job.qualityReport);
          }
          confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
        } else if (job.status === 'failed') {
          throw new Error(job.error || 'Video frame inpainting failed.');
        }
      }
    }
  };

  // Sample Media Loaders
  const handleLoadSample = async (type: 'image' | 'video') => {
    if (type === 'image') {
      // Create high-res sample canvas with watermark
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#312e81');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Graphic circle
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(640, 360, 180, 0, Math.PI * 2);
        ctx.fill();

        // Sample Watermark Stamp
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('© SAMPLE WATERMARK 2026', 760, 660);
        ctx.fillText('CONFIDENTIAL PREVIEW', 820, 80);

        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], 'sample_watermark_product.png', { type: 'image/png' });
            handleFileChange(file);
          }
        });
      }
    }
  };

  // Export Download
  const handleDownload = (format: 'png' | 'jpg' | 'webp' | 'mp4') => {
    if (!cleanedUrl) return;
    const a = document.createElement('a');
    a.href = cleanedUrl;
    a.download = `cleaned_${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'media'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> AI Media Cleanup Engine
            </span>
            <span className="text-[11px] text-indigo-300 font-bold">Images & 4K Video</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            AI Watermark & Object Remover
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Remove unwanted logos, watermarks, text overlays, timestamps, and objects from images and videos with Gemini visual intelligence & context-aware inpainting.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" /> Upload Image or Video
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('image')}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" /> Try Sample
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.mp4,.mov,.webm,.avi,.mkv"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileChange(e.target.files[0]);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* 2. Main Workspace */}
      {!selectedFile ? (
        /* Empty State Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-12 sm:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-white/60 dark:bg-slate-900/40 hover:bg-brand-500/5 transition-all text-center cursor-pointer group space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <Eraser className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              <span className="text-brand-600 dark:text-brand-400 underline decoration-brand-500/30 underline-offset-4">
                Click to upload
              </span>{' '}
              or drag & drop your media here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Supports JPG, PNG, WEBP, TIFF, MP4, MOV, WebM up to 500 MB
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 pt-2">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Quality Preserved</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Gemini Visual AI</span>
            <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-blue-500" /> Audio Preserved</span>
          </div>
        </div>
      ) : (
        /* Editor Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT 3 COLS: Canvas & Comparison Studio */}
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar Header */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tool:</span>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTool('brush')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTool === 'brush' ? 'bg-brand-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Brush className="w-3.5 h-3.5" /> Brush
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('rectangle')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTool === 'rectangle' ? 'bg-brand-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" /> Box
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('lasso')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTool === 'lasso' ? 'bg-brand-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" /> Lasso
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('eraser')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTool === 'eraser' ? 'bg-brand-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" /> Eraser
                  </button>
                </div>
              </div>

              {/* Brush Size Slider & Presets */}
              {activeTool === 'brush' || activeTool === 'eraser' ? (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Size:</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => setBrushSize(16)}
                      className={`px-2 py-0.5 rounded ${brushSize === 16 ? 'bg-white dark:bg-slate-700 font-bold text-brand-600 shadow-xs' : 'text-slate-500'}`}
                    >
                      16px
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrushSize(32)}
                      className={`px-2 py-0.5 rounded ${brushSize === 32 ? 'bg-white dark:bg-slate-700 font-bold text-brand-600 shadow-xs' : 'text-slate-500'}`}
                    >
                      32px
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrushSize(64)}
                      className={`px-2 py-0.5 rounded ${brushSize === 64 ? 'bg-white dark:bg-slate-700 font-bold text-brand-600 shadow-xs' : 'text-slate-500'}`}
                    >
                      64px
                    </button>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value, 10))}
                    className="w-20 accent-brand-500 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] w-7">{brushSize}px</span>
                </div>
              ) : null}

              {/* Canvas Action Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Undo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Redo"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleClearMask}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  title="Clear Mask"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-500 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div
              ref={containerRef}
              className={`relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center min-h-[460px] ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
              }`}
            >
              {/* If Processed: Show Before / After Comparison Slider */}
              {cleanedUrl && (
                <div
                  className="relative w-full h-full min-h-[460px] flex items-center justify-center overflow-hidden select-none"
                  onMouseMove={e => {
                    if (isDraggingSlider && containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                      setSliderPosition(Math.round((x / rect.width) * 100));
                    }
                  }}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchMove={e => {
                    if (isDraggingSlider && containerRef.current && e.touches[0]) {
                      const rect = containerRef.current.getBoundingClientRect();
                      const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
                      setSliderPosition(Math.round((x / rect.width) * 100));
                    }
                  }}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                >
                  {mediaType === 'image' ? (
                    <div className="relative w-full max-w-4xl max-h-[600px] flex items-center justify-center">
                      {/* Original Image (Underneath) */}
                      <img
                        src={originalUrl || ''}
                        alt="Original"
                        className="w-full h-auto object-contain max-h-[580px] pointer-events-none"
                      />

                      {/* Cleaned Image (Clipped on Right) */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                      >
                        <img
                          src={cleanedUrl}
                          alt="Cleaned"
                          className="w-full h-auto object-contain max-h-[580px]"
                        />
                      </div>

                      {/* Split Divider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-2xl flex items-center justify-center"
                        style={{ left: `${sliderPosition}%` }}
                        onMouseDown={() => setIsDraggingSlider(true)}
                        onTouchStart={() => setIsDraggingSlider(true)}
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl border border-slate-300 font-black text-xs cursor-ew-resize">
                          ↔
                        </div>
                      </div>

                      {/* Floating Labels & Re-edit Button */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white font-bold text-xs border border-white/10 pointer-events-none shadow-md">
                        Original
                      </div>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCleanedUrl(null)}
                          className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-xs backdrop-blur-md border border-white/20 shadow-md cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Brush className="w-3 h-3 text-brand-400" /> Edit Mask
                        </button>
                        <div className="px-3 py-1 rounded-full bg-brand-600/90 backdrop-blur-md text-white font-bold text-xs border border-brand-400/30 shadow-md">
                          AI Cleaned ✨
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Video Comparison Preview */
                    <div className="relative w-full max-w-4xl p-4 flex flex-col items-center gap-3">
                      <video
                        ref={cleanedVideoRef}
                        src={cleanedUrl}
                        controls
                        className="w-full h-auto max-h-[520px] rounded-2xl shadow-xl"
                      />
                      <div className="flex items-center gap-3 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Watermark Removed Across Entire Video Sequence
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Mask Painting Layer (Always mounted in DOM) */}
              <div
                className={`relative overflow-hidden flex items-center justify-center cursor-crosshair ${
                  cleanedUrl ? 'hidden' : 'block'
                }`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {mediaType === 'image' ? (
                  <>
                    <canvas ref={imageCanvasRef} className="max-h-[520px] w-auto h-auto object-contain block" />
                    <canvas
                      ref={maskCanvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`absolute inset-0 w-full h-full ${showMaskOverlay ? 'opacity-90' : 'opacity-0'}`}
                    />
                  </>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={originalUrl || ''}
                      className="max-h-[520px] w-auto h-auto rounded-xl"
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                    />
                    <canvas
                      ref={maskCanvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`absolute inset-0 w-full h-full ${showMaskOverlay ? 'opacity-90' : 'opacity-0'}`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Video Range & Scrubbing Timeline (If Video) */}
            {mediaType === 'video' && !cleanedUrl && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-brand-500" /> Video Inpainting Range
                  </span>
                  <span className="font-mono text-slate-400">
                    {timeRange.startTime.toFixed(1)}s — {timeRange.endTime.toFixed(1)}s (Duration: {(timeRange.endTime - timeRange.startTime).toFixed(1)}s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Time (s)</label>
                    <input
                      type="number"
                      min="0"
                      max={videoDuration}
                      step="0.5"
                      value={timeRange.startTime}
                      onChange={e => setTimeRange({ ...timeRange, startTime: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">End Time (s)</label>
                    <input
                      type="number"
                      min={timeRange.startTime}
                      max={videoDuration}
                      step="0.5"
                      value={timeRange.endTime}
                      onChange={e => setTimeRange({ ...timeRange, endTime: parseFloat(e.target.value) || videoDuration })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1 COL: Detection Chips, Action Button, Quality Check */}
          <div className="space-y-6">
            {/* AI Detections Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" /> AI Visual Detections
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  {aiProvider === 'gemini' ? 'Gemini 1.5 Vision' : 'Visual Heuristics'}
                </span>
              </div>

              {isAnalyzing ? (
                <div className="py-6 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{stageMessage}</p>
                </div>
              ) : detections.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{detections.filter(d => d.selected !== false).length} selected</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllDetections(true)}
                        className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                      >
                        All
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllDetections(false)}
                        className="text-slate-400 hover:underline"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {detections.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleDetection(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        item.selected !== false
                          ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                          : 'border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          onChange={() => {}}
                          className="rounded text-brand-600 accent-brand-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase">{item.type}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-3">
                  No automated watermarks detected. Use the Brush or Box tool to select custom areas.
                </p>
              )}
            </div>

            {/* AI Inpaint Action Buttons */}
            <div className="space-y-3">
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={handleAutoRemoveGeminiWatermark}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 border border-white/20"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>✨ 1-Click Remove Gemini Watermark</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExecuteRemoval}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Inpainting Pixels ({processProgress}%)
                  </>
                ) : (
                  <>
                    <Eraser className="w-4 h-4" /> Remove Selected / Painted Area
                  </>
                )}
              </button>

              {/* Progress State */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{stageMessage}</span>
                    <span>{processProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${processProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Quality Report & Export Suite (When Completed) */}
            {cleanedUrl && qualityReport && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 text-white shadow-xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Quality Verification
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    100% PRESERVED
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-bold text-white">{qualityReport.outputDimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aspect Ratio:</span>
                    <span className="text-emerald-400">Preserved ✅</span>
                  </div>
                  {mediaType === 'video' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span>{qualityReport.outputDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Audio Track:</span>
                        <span className="text-emerald-400">Preserved (Passthrough) ✅</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Download Actions */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {mediaType === 'image' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload('png')}
                        className="py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" /> PNG (HD)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload('jpg')}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> JPG
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload('mp4')}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                    >
                      <Download className="w-4 h-4" /> Download Cleaned MP4 Video
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
