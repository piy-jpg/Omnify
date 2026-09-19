import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Upload,
  Play,
  Pause,
  Sliders,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  Scissors,
  Wand2,
  Grid,
  FileArchive,
  Eye,
  Trash2,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Zap,
  Info,
  SlidersHorizontal,
  ChevronDown,
  Volume2,
  VolumeX,
  Gauge,
  Music,
  Tv,
  Smartphone,
  Square,
  Activity,
  FileAudio,
  Crop,
  MessageSquare,
  Palette,
  FileText,
  Plus,
  PlayCircle,
  BrainCircuit,
  Image as ImageIcon,
  Camera,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Copy,
  Languages,
  ArrowUpDown,
  CornerDownLeft,
  RotateCcw,
  Edit3,
  AlignLeft,
  Type
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExtractedFrame,
  VideoMetadata,
  ExtractionConfig,
  ExtractionProgress,
  extractVideoFrames,
  generateContactSheet,
  createFramesZip,
  generateDemoVideoBlob,
  formatTimecode
} from '../services/videoFrameEngine';
import {
  extractAudioFromVideo,
  generateVideoStoryboardGrid,
  formatTime,
  calculateAspectRatioCrop,
  generateSubtitlesFile,
  getCssFilterString,
  autoGenerateSubtitles,
  translateSubtitles,
  shiftSubtitleCues,
  parseSubtitlesFile,
  SubtitleCue,
  SubtitleStyle,
  VideoFilterSettings
} from '../services/video/videoToolsEngine';
import { VideoSplitterView } from '../components/video/VideoSplitterView';
import { MLDatasetExtractorView } from '../components/video/MLDatasetExtractorView';
import { formatBytes } from '../utils/formatters';
import { FileItem } from '../types';

interface VideoFrameStudioPageProps {
  onFileConverted?: (file: FileItem) => void;
}

type StudioToolTab = 'frames' | 'splitter' | 'mldataset' | 'subtitles' | 'filters' | 'audio' | 'storyboard' | 'aspect' | 'speed';

const INITIAL_SUBTITLES: SubtitleCue[] = [
  { id: 1, startTime: 0, endTime: 2.8, text: 'Welcome to ConvertPro Universal Video Studio!' },
  { id: 2, startTime: 2.8, endTime: 5.5, text: 'Transform, extract, and color-grade your video clips instantly.' },
  { id: 3, startTime: 5.5, endTime: 8.2, text: '100% client-side GPU acceleration in your browser.' },
  { id: 4, startTime: 8.2, endTime: 11.0, text: 'Export high-definition frames, audio tracks, and subtitles.' }
];

export const VideoFrameStudioPage: React.FC<VideoFrameStudioPageProps> = ({
  onFileConverted
}) => {
  // Active Tool Tab
  const [activeToolTab, setActiveToolTab] = useState<StudioToolTab>('frames');

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Timeline Range Trimmer
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  // Extraction Method Configuration
  const [method, setMethod] = useState<ExtractionConfig['method']>('number');
  const [frameCount, setFrameCount] = useState<number>(50);
  const [fpsRate, setFpsRate] = useState<number>(2);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(1);
  const [outputFormat, setOutputFormat] = useState<ExtractionConfig['outputFormat']>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.92);
  const [targetResolution, setTargetResolution] = useState<ExtractionConfig['targetResolution']>('original');
  const [customWidth, setCustomWidth] = useState<number>(1920);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [namingPattern, setNamingPattern] = useState<string>('frame_{number}');

  // Advanced Enhancements
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [sharpen, setSharpen] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  // Progress & Cancel
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const cancelExtractionRef = useRef(false);

  // Extracted Results & Sequential Browsing States
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [contactSheetUrl, setContactSheetUrl] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [isDownloadingFrames, setIsDownloadingFrames] = useState(false);

  // Tool 2: Audio Extractor States
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'wav' | 'mp3'>('wav');
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);
  const [audioStats, setAudioStats] = useState<{ duration: number; size: number } | null>(null);

  // Tool 3: Storyboard Matrix States
  const [storyboardGridType, setStoryboardGridType] = useState<'3x3' | '4x4'>('3x3');
  const [storyboardUrl, setStoryboardUrl] = useState<string | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);

  // Tool 4: Aspect Ratio States
  const [targetAspect, setTargetAspect] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('9:16');
  const [isAspectProcessing, setIsAspectProcessing] = useState(false);
  const [aspectCroppedUrl, setAspectCroppedUrl] = useState<string | null>(null);

  // Tool 5: Subtitles & Captions States
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(INITIAL_SUBTITLES);
  const [subtitleFormat, setSubtitleFormat] = useState<'srt' | 'vtt' | 'txt' | 'json'>('srt');
  const [newCueText, setNewCueText] = useState('');
  const [newCueStartTime, setNewCueStartTime] = useState<number>(0);
  const [newCueEndTime, setNewCueEndTime] = useState<number>(3.0);
  const [isAutoGeneratingSubtitles, setIsAutoGeneratingSubtitles] = useState(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState('en');
  const [isTranslatingSubtitles, setIsTranslatingSubtitles] = useState(false);
  const [showSubtitleStyleSettings, setShowSubtitleStyleSettings] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontSize: 'medium',
    position: 'bottom',
    color: 'white',
    bgStyle: 'box'
  });
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [editingCueId, setEditingCueId] = useState<number | null>(null);
  const subtitleFileInputRef = useRef<HTMLInputElement>(null);

  // Tool 6: Color Grading & Filters States
  const [filterSettings, setFilterSettings] = useState<VideoFilterSettings>({
    preset: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    blur: 0
  });
  const [gradedSnapshotUrl, setGradedSnapshotUrl] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
      if (extractedAudioUrl) URL.revokeObjectURL(extractedAudioUrl);
    };
  }, [videoSrc, extractedAudioUrl]);

  // Handle Video Selection
  const handleVideoSelect = (file: File) => {
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoSrc(url);
    setFrames([]);
    setSelectedFrameIds(new Set());
    setProgress(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setExtractedAudioUrl(null);
    setStoryboardUrl(null);
    setAspectCroppedUrl(null);
    setGradedSnapshotUrl(null);
  };

  // Load Synthetic Demo Video
  const handleLoadDemoVideo = async () => {
    try {
      const demoBlob = await generateDemoVideoBlob();
      const demoFile = new File([demoBlob], 'ConvertPro_Demo_Video.webm', { type: 'video/webm' });
      handleVideoSelect(demoFile);
    } catch (e) {
      console.error('Failed to generate demo video', e);
    }
  };

  // When video metadata loads
  const handleLoadedMetadata = () => {
    if (videoPlayerRef.current) {
      const v = videoPlayerRef.current;
      const meta: VideoMetadata = {
        name: videoFile ? videoFile.name : 'Sample Video',
        duration: v.duration || 10,
        width: v.videoWidth || 1920,
        height: v.videoHeight || 1080,
        fileSize: videoFile ? videoFile.size : 12400000,
        fps: 30,
        format: videoFile ? videoFile.name.split('.').pop()?.toUpperCase() || 'MP4' : 'WEBM'
      };
      setMetadata(meta);
      setRangeStart(0);
      setRangeEnd(v.duration || 10);
      setCustomWidth(v.videoWidth || 1920);
      setCustomHeight(v.videoHeight || 1080);
    }
  };

  // Time update listener
  const handleTimeUpdate = () => {
    if (videoPlayerRef.current) {
      setCurrentTime(videoPlayerRef.current.currentTime);
      if (rangeEnd > 0 && videoPlayerRef.current.currentTime >= rangeEnd) {
        videoPlayerRef.current.currentTime = rangeStart;
        if (!isPlaying) {
          videoPlayerRef.current.pause();
        }
      }
    }
  };

  const handleTogglePlay = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        if (currentTime >= rangeEnd && rangeEnd > 0) {
          videoPlayerRef.current.currentTime = rangeStart;
        }
        videoPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Step Frame forward or backward
  const stepFrame = (direction: number) => {
    if (videoPlayerRef.current) {
      const fps = metadata?.fps || 30;
      const frameDuration = 1 / fps;
      const newTime = Math.max(0, Math.min((metadata?.duration || 10), currentTime + direction * frameDuration));
      videoPlayerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Step Seconds forward or backward
  const stepSeconds = (seconds: number) => {
    if (videoPlayerRef.current) {
      const newTime = Math.max(0, Math.min((metadata?.duration || 10), currentTime + seconds));
      videoPlayerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Instant Single Frame Snapshot Capture
  const handleCaptureCurrentFrame = async () => {
    if (!videoPlayerRef.current) return;
    const v = videoPlayerRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1920;
    canvas.height = v.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = getCssFilterString(filterSettings);
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const mime = outputFormat || 'image/jpeg';
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, quality));
      if (blob) {
        const dataUrl = canvas.toDataURL(mime, quality);
        const newFrame: ExtractedFrame = {
          id: `frame-snap-${Date.now()}`,
          frameIndex: frames.length + 1,
          timestamp: currentTime,
          formattedTime: formatTimecode(currentTime),
          blob,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          sizeBytes: blob.size,
          sharpnessScore: 88,
          sceneGroup: 1,
          isAiSelected: true
        };
        setFrames(prev => [newFrame, ...prev]);
        confetti({ particleCount: 40, spread: 50 });
      }
    }
  };

  // Generate Contact Sheet Matrix
  const handleGenerateContactSheet = async () => {
    if (frames.length === 0) return;
    setIsGeneratingSheet(true);
    try {
      const res = await generateContactSheet(
        frames,
        videoFile?.name || 'Video Sequential Frame Contact Sheet',
        5,
        true
      );
      setContactSheetUrl(res.dataUrl);
      confetti({ particleCount: 60, spread: 60 });
    } catch (err) {
      console.error('Contact sheet generation failed:', err);
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  // Package the actual extracted frame blobs and hand the completed archive to the browser.
  const handleDownloadFramesZip = async () => {
    if (frames.length === 0 || isDownloadingFrames) return;

    setIsDownloadingFrames(true);
    try {
      const extensionByMimeType: Record<ExtractionConfig['outputFormat'], string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const sourceName = videoFile?.name || metadata?.name || 'video';
      const contactSheetBlob = contactSheetUrl
        ? await fetch(contactSheetUrl).then(response => response.blob())
        : undefined;
      const zipBlob = await createFramesZip(
        frames,
        sourceName,
        extensionByMimeType[outputFormat],
        namingPattern || 'frame',
        contactSheetBlob
      );
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${sourceName.replace(/\.[^/.]+$/, '')}_Frames.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Keep the object URL alive long enough for Safari and mobile browsers to begin the download.
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.65 } });
    } catch (error) {
      console.error('Frame ZIP download failed:', error);
    } finally {
      setIsDownloadingFrames(false);
    }
  };

  // Instant single frame download with direct Blob URL
  const handleDownloadSingleFrame = async (frame: ExtractedFrame, index?: number) => {
    try {
      const ext = outputFormat === 'image/png' ? 'png' : outputFormat === 'image/webp' ? 'webp' : 'jpg';
      const frameNum = String((index !== undefined ? index + 1 : frame.frameIndex) || 1).padStart(3, '0');
      const filename = `frame_${frameNum}.${ext}`;

      let blobToDownload = frame.blob;
      if (!blobToDownload && frame.dataUrl) {
        try {
          const res = await fetch(frame.dataUrl);
          blobToDownload = await res.blob();
        } catch (err) {
          // Fallback
        }
      }

      if (blobToDownload) {
        const downloadUrl = URL.createObjectURL(blobToDownload);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
      } else if (frame.dataUrl) {
        const link = document.createElement('a');
        link.href = frame.dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (e) {
      console.error('Single frame download error:', e);
    }
  };

  // Keyboard navigation for Sequential Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || frames.length === 0) return;
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev !== null ? (prev > 0 ? prev - 1 : frames.length - 1) : null));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev !== null ? (prev < frames.length - 1 ? prev + 1 : 0) : null));
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, frames.length]);

  // Start Frame Extraction
  const handleStartExtraction = async () => {
    if (!videoSrc) return;
    setIsExtracting(true);
    cancelExtractionRef.current = false;

    const config: ExtractionConfig = {
      method,
      frameCount,
      fpsRate,
      intervalSeconds,
      startTime: rangeStart,
      endTime: rangeEnd || (metadata?.duration || 10),
      outputFormat,
      quality,
      targetResolution,
      customWidth,
      customHeight,
      namingPattern: namingPattern || 'frame_{number}',
      autoEnhance,
      sharpen,
      removeDuplicates
    };

    try {
      const extracted = await extractVideoFrames(
        videoFile || videoSrc,
        config,
        (prog) => setProgress(prog),
        () => cancelExtractionRef.current
      );

      setFrames(extracted);
      setSelectedFrameIds(new Set(extracted.map(f => f.id)));
      setIsExtracting(false);

      if (extracted.length > 0) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        if (onFileConverted && videoFile) {
          onFileConverted({
            id: `vfs-${Date.now()}`,
            name: `${videoFile.name.replace(/\.[^/.]+$/, '')}_Frames.zip`,
            size: extracted.reduce((acc, f) => acc + f.sizeBytes, 0),
            type: 'application/zip',
            extension: 'ZIP',
            uploadedAt: 'Just now',
            status: 'ready'
          });
        }
      }
    } catch (err) {
      console.error('Frame extraction failed', err);
      setIsExtracting(false);
    }
  };

  // Tool 2: Audio Extractor Handler
  const handleExtractAudio = async () => {
    if (!videoFile && !videoSrc) return;
    setIsExtractingAudio(true);
    try {
      let targetFile = videoFile;
      if (!targetFile && videoSrc) {
        const res = await fetch(videoSrc);
        const blob = await res.blob();
        targetFile = new File([blob], 'video.webm', { type: 'video/webm' });
      }

      if (targetFile) {
        const result = await extractAudioFromVideo(targetFile, audioFormat);
        setExtractedAudioUrl(result.url);
        setAudioStats({ duration: result.duration, size: result.sizeBytes });
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

        if (onFileConverted) {
          const base = (videoFile?.name || 'Video').replace(/\.[^/.]+$/, '');
          onFileConverted({
            id: `audio-${Date.now()}`,
            name: `${base}_Audio.wav`,
            size: result.sizeBytes,
            type: 'audio/wav',
            extension: 'WAV',
            uploadedAt: 'Just now',
            status: 'ready',
            convertedUrl: result.url
          });
        }
      }
    } catch (err) {
      console.error('Audio extraction failed:', err);
    } finally {
      setIsExtractingAudio(false);
    }
  };

  // Tool 3: Storyboard Grid Handler
  const handleGenerateStoryboard = async () => {
    if (!videoPlayerRef.current) return;
    setIsGeneratingStoryboard(true);
    try {
      const result = await generateVideoStoryboardGrid(
        videoPlayerRef.current,
        storyboardGridType
      );
      setStoryboardUrl(result.dataUrl);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });

      if (onFileConverted) {
        const base = (videoFile?.name || 'Video').replace(/\.[^/.]+$/, '');
        onFileConverted({
          id: `storyboard-${Date.now()}`,
          name: `${base}_Storyboard_${storyboardGridType}.jpg`,
          size: result.blob.size,
          type: 'image/jpeg',
          extension: 'JPG',
          uploadedAt: 'Just now',
          status: 'ready',
          convertedUrl: result.dataUrl
        });
      }
    } catch (err) {
      console.error('Storyboard generation failed:', err);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Tool 4: Aspect Ratio Crop Preview
  const handleGenerateAspectCrop = () => {
    if (!videoPlayerRef.current) return;
    setIsAspectProcessing(true);
    try {
      const v = videoPlayerRef.current;
      const crop = calculateAspectRatioCrop(v.videoWidth || 1920, v.videoHeight || 1080, targetAspect);

      const canvas = document.createElement('canvas');
      canvas.width = crop.outWidth;
      canvas.height = crop.outHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, crop.outWidth, crop.outHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setAspectCroppedUrl(dataUrl);
        confetti({ particleCount: 50, spread: 50 });
      }
    } catch (err) {
      console.error('Aspect crop failed:', err);
    } finally {
      setIsAspectProcessing(false);
    }
  };

  // Tool 5: Subtitle Actions
  const handleAddSubtitleCue = () => {
    if (!newCueText.trim()) return;
    const dur = metadata?.duration || 10;
    const start = Math.max(0, Math.min(dur, Math.round(newCueStartTime * 10) / 10));
    let end = Math.max(0, Math.min(dur, Math.round(newCueEndTime * 10) / 10));
    if (end <= start) {
      end = Math.min(dur, Math.round((start + 2.5) * 10) / 10);
    }
    const newCue: SubtitleCue = {
      id: Date.now(),
      startTime: start,
      endTime: end,
      text: newCueText.trim()
    };
    setSubtitles(prev => [...prev, newCue].sort((a, b) => a.startTime - b.startTime));
    setNewCueText('');
    const nextStart = end;
    const nextEnd = Math.min(dur, Math.round((nextStart + 3.0) * 10) / 10);
    setNewCueStartTime(nextStart);
    setNewCueEndTime(nextEnd);
  };

  const handleAutoGenerateSubtitles = async () => {
    setIsAutoGeneratingSubtitles(true);
    try {
      const dur = metadata?.duration || 10;
      const cues = await autoGenerateSubtitles(dur, subtitleLanguage, videoFile?.name || 'Video');
      setSubtitles(cues);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {
      console.error('Auto subtitle generation failed:', err);
    } finally {
      setIsAutoGeneratingSubtitles(false);
    }
  };

  const handleTranslateSubtitles = async (targetLang: string) => {
    setIsTranslatingSubtitles(true);
    try {
      const translated = await translateSubtitles(subtitles, targetLang);
      setSubtitles(translated);
      confetti({ particleCount: 50, spread: 50 });
    } catch (err) {
      console.error('Subtitle translation failed:', err);
    } finally {
      setIsTranslatingSubtitles(false);
    }
  };

  const handleShiftSubtitles = (offsetSec: number) => {
    setSubtitles(prev => shiftSubtitleCues(prev, offsetSec));
  };

  const handleImportSubtitles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseSubtitlesFile(content);
        if (parsed.length > 0) {
          setSubtitles(parsed);
          confetti({ particleCount: 60, spread: 50 });
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleCopySubtitles = () => {
    const file = generateSubtitlesFile(subtitles, subtitleFormat);
    navigator.clipboard.writeText(file.content);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleUpdateCue = (id: number, updates: Partial<SubtitleCue>) => {
    setSubtitles(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSnapCue = (id: number, type: 'start' | 'end') => {
    setSubtitles(prev => prev.map(c => {
      if (c.id === id) {
        if (type === 'start') {
          return { ...c, startTime: Math.round(currentTime * 10) / 10 };
        } else {
          return { ...c, endTime: Math.max(c.startTime + 0.5, Math.round(currentTime * 10) / 10) };
        }
      }
      return c;
    }));
  };

  const handleDownloadSubtitles = () => {
    const file = generateSubtitlesFile(subtitles, subtitleFormat);
    const a = document.createElement('a');
    a.href = file.url;
    a.download = `${(videoFile?.name || 'video').replace(/\.[^/.]+$/, '')}.${subtitleFormat}`;
    a.click();
    confetti({ particleCount: 60, spread: 60 });
  };

  const handleBurnInSubtitleSnapshot = () => {
    if (!videoPlayerRef.current) return;
    const v = videoPlayerRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = getCssFilterString(filterSettings);
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

      if (activeSubtitle) {
        const text = activeSubtitle.text;
        const fontSize = subtitleStyle.fontSize === 'small' ? 24 : subtitleStyle.fontSize === 'large' ? 42 : subtitleStyle.fontSize === 'xlarge' ? 52 : 32;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textMetrics = ctx.measureText(text);
        const padding = 20;
        const boxWidth = textMetrics.width + padding * 2;
        const boxHeight = fontSize * 1.5;

        const posX = canvas.width / 2;
        const posY = subtitleStyle.position === 'top' ? 80 : subtitleStyle.position === 'middle' ? canvas.height / 2 : canvas.height - 70;

        if (subtitleStyle.bgStyle === 'box') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
          ctx.beginPath();
          ctx.roundRect(posX - boxWidth / 2, posY - boxHeight / 2, boxWidth, boxHeight, 14);
          ctx.fill();
        }

        ctx.fillStyle = subtitleStyle.color === 'yellow' ? '#fde047' : subtitleStyle.color === 'cyan' ? '#38bdf8' : subtitleStyle.color === 'green' ? '#4ade80' : '#ffffff';
        ctx.fillText(text, posX, posY);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `caption_snapshot_${formatTime(currentTime).replace(':', '_')}.jpg`;
      a.click();
      confetti({ particleCount: 50, spread: 50 });
    }
  };

  // Tool 6: Color Graded Frame Snapshot
  const handleCaptureGradedSnapshot = () => {
    if (!videoPlayerRef.current) return;
    const v = videoPlayerRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = getCssFilterString(filterSettings);
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg', 0.95);
      setGradedSnapshotUrl(url);
      confetti({ particleCount: 50, spread: 50 });
    }
  };

  // Tool 7: Change Playback Rate
  const handleChangeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = speed;
    }
  };

  // Current active subtitle for video overlay
  const activeSubtitle = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);

  return (
    <div className="space-y-6">
      
      {/* 1. STUDIO HEADER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <Film className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Universal Video Tools Studio</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                GPU Fast Engine
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Extract frames, generate subtitles (.SRT/.VTT), extract audio (WAV/MP3), apply color grading, build storyboards, and adjust aspect ratios in your browser.
          </p>
        </div>

        {/* Video Upload & Demo Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
            className="hidden"
          />

          {!videoSrc && (
            <button
              onClick={handleLoadDemoVideo}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Try Demo Video</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{videoSrc ? 'Change Video' : 'Upload Video File'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLS NAVIGATION BAR */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'frames', label: 'Split Video to Images', icon: ImageIcon },
          { id: 'splitter', label: 'Split Video to Clips', icon: Scissors },
          { id: 'mldataset', label: 'AI/ML Dataset Generator', icon: BrainCircuit },
          { id: 'subtitles', label: 'Subtitle Generator', icon: MessageSquare },
          { id: 'filters', label: 'Color Grading & Filters', icon: Palette },
          { id: 'audio', label: 'Audio Extractor', icon: Music },
          { id: 'storyboard', label: 'Storyboard Matrix', icon: Grid },
          { id: 'aspect', label: 'Aspect Ratio Crop', icon: Crop },
          { id: 'speed', label: 'Speed & Slow-Mo', icon: Gauge }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeToolTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveToolTab(tab.id as StudioToolTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. DEDICATED TOOL VIEWS */}
      {activeToolTab === 'splitter' ? (
        <VideoSplitterView initialVideoFile={videoFile} />
      ) : activeToolTab === 'mldataset' ? (
        <MLDatasetExtractorView initialVideoFile={videoFile} />
      ) : (
        /* 4. MAIN VIDEO WORKSPACE CONTAINER (FOR OTHER SUB-TOOLS) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: VIDEO PLAYER & METADATA */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 overflow-hidden">
            
            {/* HTML5 Video Player Container with Live Subtitle & Filter Overlay */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center group">
              {videoSrc ? (
                <>
                  <video
                    ref={videoPlayerRef}
                    src={videoSrc}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                    style={{ filter: getCssFilterString(filterSettings) }}
                    className="w-full h-full object-contain transition-all duration-200"
                  />

                  {/* Live Subtitle Overlay */}
                  {activeSubtitle && (
                    <div className={`absolute left-4 right-4 text-center pointer-events-none z-10 ${
                      subtitleStyle.position === 'top'
                        ? 'top-4'
                        : subtitleStyle.position === 'middle'
                        ? 'top-1/2 -translate-y-1/2'
                        : 'bottom-4'
                    }`}>
                      <span className={`inline-block px-3.5 py-1.5 rounded-xl font-semibold tracking-wide transition-all ${
                        subtitleStyle.fontSize === 'small'
                          ? 'text-[11px] sm:text-xs'
                          : subtitleStyle.fontSize === 'large'
                          ? 'text-sm sm:text-base'
                          : subtitleStyle.fontSize === 'xlarge'
                          ? 'text-base sm:text-lg'
                          : 'text-xs sm:text-sm'
                      } ${
                        subtitleStyle.color === 'yellow'
                          ? 'text-yellow-300'
                          : subtitleStyle.color === 'cyan'
                          ? 'text-cyan-300'
                          : subtitleStyle.color === 'green'
                          ? 'text-emerald-300'
                          : 'text-white'
                      } ${
                        subtitleStyle.bgStyle === 'box'
                          ? 'bg-black/85 shadow-lg border border-white/20 backdrop-blur-xs'
                          : subtitleStyle.bgStyle === 'outline'
                          ? 'bg-transparent text-shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]'
                          : 'bg-black/50 backdrop-blur-xs'
                      }`}>
                        {activeSubtitle.text}
                      </span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div
                    onClick={handleTogglePlay}
                    className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20"
                  >
                    <div className="p-4 rounded-full bg-white/90 text-slate-900 shadow-xl backdrop-blur-sm transform hover:scale-110 transition-transform">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Film className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Upload a video or try the demo video to begin.</p>
                  <button
                    onClick={handleLoadDemoVideo}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-400 font-bold text-xs"
                  >
                    Load Demo Video
                  </button>
                </div>
              )}
            </div>

            {/* Sequential Video & Frame Browser Bar */}
            {videoSrc && metadata && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatTimecode(currentTime)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                      Frame #{Math.round(currentTime * (metadata.fps || 30)) + 1} / {Math.round(metadata.duration * (metadata.fps || 30))}
                    </span>
                  </div>
                  <span className="text-slate-400">{formatTimecode(metadata.duration)}</span>
                </div>

                {/* Progress Scrubber */}
                <input
                  type="range"
                  min={0}
                  max={metadata.duration || 10}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                />

                {/* Sequential Frame Stepping Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSeek(0)}
                      title="Jump to Start"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => stepSeconds(-1)}
                      title="Back 1 Second"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-mono font-bold"
                    >
                      -1s
                    </button>
                    <button
                      onClick={() => stepFrame(-1)}
                      title="Previous Frame (1/FPS)"
                      className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>-1 Fr</span>
                    </button>
                    <button
                      onClick={handleTogglePlay}
                      className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => stepFrame(1)}
                      title="Next Frame (1/FPS)"
                      className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center gap-0.5"
                    >
                      <span>+1 Fr</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => stepSeconds(1)}
                      title="Forward 1 Second"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-mono font-bold"
                    >
                      +1s
                    </button>
                    <button
                      onClick={() => handleSeek(metadata.duration)}
                      title="Jump to End"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCaptureCurrentFrame}
                      title="Capture single frame image at current timestamp"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Capture Frame</span>
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SUB-TOOL CONFIG & OUTPUTS */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* TAB 1: SPLIT VIDEO TO IMAGES */}
          {activeToolTab === 'frames' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Split Video into Images</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Divide your video into high-resolution JPG, PNG, or WebP image files.
                  </p>
                </div>
              </div>

              {/* Extraction Modes */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'number', label: 'Exact Images', desc: 'Specify total count' },
                  { id: 'interval', label: 'By Interval', desc: 'Every N seconds' },
                  { id: 'fps', label: 'By FPS Rate', desc: 'Frames per second' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      method === m.id
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600'
                    }`}
                  >
                    <p>{m.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* Mode-Specific Value Selectors */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                {method === 'number' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Number of Images to Split</span>
                      <span className="text-[11px] font-bold text-purple-600">Range: 2 to 2,000 images</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFrameCount(Math.max(2, frameCount - 10))}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 font-bold"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={2}
                        max={2000}
                        value={frameCount}
                        onChange={(e) => setFrameCount(Math.max(2, Math.min(2000, parseInt(e.target.value) || 2)))}
                        className="flex-1 py-1.5 text-center font-bold font-mono text-sm bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => setFrameCount(Math.min(2000, frameCount + 10))}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-200 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {method === 'interval' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Split Interval (Seconds)</span>
                      <span className="text-[11px] font-mono text-purple-600">
                        Approx. {Math.ceil((metadata?.duration || 10) / intervalSeconds)} images
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[0.25, 0.5, 1.0, 2.0].map(sec => (
                        <button
                          key={sec}
                          onClick={() => setIntervalSeconds(sec)}
                          className={`py-1.5 rounded-xl text-xs font-bold border ${
                            intervalSeconds === sec
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {method === 'fps' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Frame Extraction Rate (FPS)</span>
                      <span className="text-[11px] font-mono text-purple-600">
                        Approx. {Math.ceil((metadata?.duration || 10) * fpsRate)} images
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 5, 10, 30].map(fps => (
                        <button
                          key={fps}
                          onClick={() => setFpsRate(fps)}
                          className={`py-1.5 rounded-xl text-xs font-bold border ${
                            fpsRate === fps
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {fps} FPS
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Format Selection & Action */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Output Image Format</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {['image/jpeg', 'image/png', 'image/webp'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt as any)}
                        className={`py-2 rounded-xl text-xs font-semibold border ${
                          outputFormat === fmt
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {fmt.split('/')[1].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartExtraction}
                  disabled={!videoSrc || isExtracting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isExtracting ? 'Splitting Video into Images...' : 'Split Video into Images'}</span>
                </button>
              </div>

              {/* Extracted Frames Summary */}
              {frames.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {frames.length} images generated
                  </span>
                  <button
                    onClick={handleDownloadFramesZip}
                    disabled={isDownloadingFrames}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:cursor-wait disabled:opacity-70"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>{isDownloadingFrames ? 'Preparing ZIP...' : 'Download Images (ZIP)'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBTITLE & CAPTION GENERATOR */}
          {activeToolTab === 'subtitles' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              
              {/* 1. Header & Format Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Subtitle & Caption Studio</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {subtitles.length} Cues
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-generate AI speech captions, edit timestamps, customize styling, and export .SRT/.VTT.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Format Selector */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                    {(['srt', 'vtt', 'txt', 'json'] as const).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setSubtitleFormat(fmt)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase transition-all ${
                          subtitleFormat === fmt
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>

                  {/* Style Toggle Button */}
                  <button
                    onClick={() => setShowSubtitleStyleSettings(prev => !prev)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      showSubtitleStyleSettings
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Styling</span>
                  </button>
                </div>
              </div>

              {/* 2. Subtitle Style Customizer Accordion */}
              {showSubtitleStyleSettings && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                    <span>Live Video Subtitle Display Styling</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Font Size */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Font Size</label>
                      <select
                        value={subtitleStyle.fontSize}
                        onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontSize: e.target.value as any }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-white"
                      >
                        <option value="small">Small (14px)</option>
                        <option value="medium">Medium (18px)</option>
                        <option value="large">Large (22px)</option>
                        <option value="xlarge">Extra Large (28px)</option>
                      </select>
                    </div>

                    {/* Position */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Position</label>
                      <select
                        value={subtitleStyle.position}
                        onChange={(e) => setSubtitleStyle(prev => ({ ...prev, position: e.target.value as any }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-white"
                      >
                        <option value="bottom">Bottom Overlay</option>
                        <option value="middle">Center Overlay</option>
                        <option value="top">Top Overlay</option>
                      </select>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Text Color</label>
                      <select
                        value={subtitleStyle.color}
                        onChange={(e) => setSubtitleStyle(prev => ({ ...prev, color: e.target.value as any }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-white"
                      >
                        <option value="white">Crisp White</option>
                        <option value="yellow">Classic Yellow</option>
                        <option value="cyan">Cyber Cyan</option>
                        <option value="green">Soft Green</option>
                      </select>
                    </div>

                    {/* Box Style */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Background</label>
                      <select
                        value={subtitleStyle.bgStyle}
                        onChange={(e) => setSubtitleStyle(prev => ({ ...prev, bgStyle: e.target.value as any }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-white"
                      >
                        <option value="box">Translucent Box</option>
                        <option value="outline">Text Outline / Shadow</option>
                        <option value="none">Minimal Translucent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. AI Smart Generation & Tools Action Bar */}
              <div className="flex items-center justify-between gap-2.5 flex-wrap p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Language Selector */}
                  <select
                    value={subtitleLanguage}
                    onChange={(e) => setSubtitleLanguage(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
                  >
                    <option value="en">English (US/UK)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>

                  {/* AI Auto-Generate Button */}
                  <button
                    onClick={handleAutoGenerateSubtitles}
                    disabled={isAutoGeneratingSubtitles}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAutoGeneratingSubtitles ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isAutoGeneratingSubtitles ? 'Transcribing Speech...' : 'Auto-Generate AI Captions'}</span>
                  </button>

                  {/* AI Translate Dropdown */}
                  <div className="relative group">
                    <button
                      disabled={isTranslatingSubtitles || subtitles.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <Languages className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isTranslatingSubtitles ? 'Translating...' : 'Translate'}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1 hidden group-hover:block z-30">
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'es', label: 'Spanish' },
                        { code: 'fr', label: 'French' },
                        { code: 'de', label: 'German' },
                        { code: 'hi', label: 'Hindi' }
                      ].map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => handleTranslateSubtitles(lang.code)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Import & Shift Tools */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={subtitleFileInputRef}
                    accept=".srt,.vtt,.txt"
                    onChange={handleImportSubtitles}
                    className="hidden"
                  />
                  <button
                    onClick={() => subtitleFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import .SRT</span>
                  </button>

                  {/* Timestamp Offset Shift */}
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                    <button
                      onClick={() => handleShiftSubtitles(-0.5)}
                      title="Shift all subtitles -0.5s"
                      className="px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                    >
                      -0.5s
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      onClick={() => handleShiftSubtitles(0.5)}
                      title="Shift all subtitles +0.5s"
                      className="px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                    >
                      +0.5s
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Add New Caption Cue Composer (Type text + Manual Scroll / Type Timestamps) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Add Caption Cue
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      Duration: {Math.max(0.1, Math.round((newCueEndTime - newCueStartTime) * 10) / 10).toFixed(1)}s
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSeek(newCueStartTime)}
                      title="Jump player to cue start time"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:text-purple-600 hover:border-purple-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      ▶ Preview Start
                    </button>
                  </div>
                </div>

                {/* Caption Text Input */}
                <div>
                  <textarea
                    rows={2}
                    placeholder="Type subtitle or dialogue text here (Press Enter to add)..."
                    value={newCueText}
                    onChange={(e) => setNewCueText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddSubtitleCue();
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium resize-none"
                  />
                </div>

                {/* Dual Time Controls: Start & End (Scroll or Type) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Start Time Controller */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Start Time:</span>
                        <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                          {formatTime(newCueStartTime)}
                        </span>
                      </div>
                      {/* Direct Numeric Type */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={metadata?.duration || 100}
                          value={newCueStartTime}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setNewCueStartTime(Math.round(val * 10) / 10);
                            if (newCueEndTime <= val) setNewCueEndTime(Math.round((val + 2.5) * 10) / 10);
                          }}
                          className="w-16 px-1.5 py-0.5 text-[11px] font-mono font-bold text-right rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">s</span>
                      </div>
                    </div>

                    {/* Scroll / Scrub Range Slider */}
                    <div className="pt-0.5">
                      <input
                        type="range"
                        min="0"
                        max={metadata?.duration || 10}
                        step="0.1"
                        value={newCueStartTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewCueStartTime(val);
                          if (newCueEndTime <= val) setNewCueEndTime(Math.min(metadata?.duration || 100, Math.round((val + 2.5) * 10) / 10));
                        }}
                        className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Quick Snap & Micro Nudges */}
                    <div className="flex items-center justify-between gap-1 pt-0.5 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          const snap = Math.round(currentTime * 10) / 10;
                          setNewCueStartTime(snap);
                          if (newCueEndTime <= snap) setNewCueEndTime(Math.round((snap + 2.5) * 10) / 10);
                        }}
                        title="Snap start time to current playhead"
                        className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 hover:bg-purple-100 font-bold transition-colors cursor-pointer"
                      >
                        🎯 Playhead ({formatTime(currentTime)})
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setNewCueStartTime(prev => Math.max(0, Math.round((prev - 0.5) * 10) / 10))}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          -0.5s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueStartTime(prev => Math.max(0, Math.round((prev - 0.1) * 10) / 10))}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          -0.1s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueStartTime(prev => Math.round((prev + 0.1) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          +0.1s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueStartTime(prev => Math.round((prev + 0.5) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          +0.5s
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* End Time Controller */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">End Time:</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatTime(newCueEndTime)}
                        </span>
                      </div>
                      {/* Direct Numeric Type */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={metadata?.duration || 100}
                          value={newCueEndTime}
                          onChange={(e) => {
                            const val = Math.max(newCueStartTime + 0.1, parseFloat(e.target.value) || 0);
                            setNewCueEndTime(Math.round(val * 10) / 10);
                          }}
                          className="w-16 px-1.5 py-0.5 text-[11px] font-mono font-bold text-right rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">s</span>
                      </div>
                    </div>

                    {/* Scroll / Scrub Range Slider */}
                    <div className="pt-0.5">
                      <input
                        type="range"
                        min="0"
                        max={metadata?.duration || 10}
                        step="0.1"
                        value={newCueEndTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewCueEndTime(val);
                        }}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Quick Presets & Nudges */}
                    <div className="flex items-center justify-between gap-1 pt-0.5 text-[9px] font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-sans text-[8px] uppercase font-bold">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setNewCueEndTime(Math.round((newCueStartTime + 2.0) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 hover:bg-indigo-100 font-bold"
                        >
                          +2s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueEndTime(Math.round((newCueStartTime + 3.0) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 hover:bg-indigo-100 font-bold"
                        >
                          +3s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueEndTime(Math.round((newCueStartTime + 5.0) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 hover:bg-indigo-100 font-bold"
                        >
                          +5s
                        </button>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setNewCueEndTime(prev => Math.max(newCueStartTime + 0.1, Math.round((prev - 0.5) * 10) / 10))}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          -0.5s
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCueEndTime(prev => Math.round((prev + 0.5) * 10) / 10)}
                          className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          +0.5s
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Submit Bar */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>Range: </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      {formatTime(newCueStartTime)} → {formatTime(newCueEndTime)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubtitleCue}
                    disabled={!newCueText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Subtitle Cue</span>
                  </button>
                </div>
              </div>

              {/* 5. Subtitle Cue Interactive List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {subtitles.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                    <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No subtitle cues yet.
                    </p>
                    <button
                      onClick={handleAutoGenerateSubtitles}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      Click here to auto-generate speech captions with AI
                    </button>
                  </div>
                ) : (
                  subtitles.map((cue, idx) => {
                    const isCurrentlyActive = currentTime >= cue.startTime && currentTime <= cue.endTime;

                    return (
                      <div
                        key={cue.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrentlyActive
                            ? 'border-purple-600 bg-purple-50/90 dark:bg-purple-950/70 shadow-sm ring-2 ring-purple-500/20'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Timing Controls & Index */}
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              #{idx + 1}
                            </span>

                            {isCurrentlyActive && (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                                LIVE
                              </span>
                            )}

                            {/* Direct Type Start & End inputs */}
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-purple-200/60 dark:border-purple-800">
                              <button
                                onClick={() => handleSeek(cue.startTime)}
                                title="Jump video to start time"
                                className="hover:underline cursor-pointer"
                              >
                                {formatTime(cue.startTime)}
                              </button>
                              <span>—</span>
                              <button
                                onClick={() => handleSeek(cue.endTime)}
                                title="Jump video to end time"
                                className="hover:underline cursor-pointer"
                              >
                                {formatTime(cue.endTime)}
                              </button>
                            </div>

                            {/* Micro Nudge Offset */}
                            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[9px] font-mono">
                              <button
                                onClick={() => handleUpdateCue(cue.id, { startTime: Math.max(0, cue.startTime - 0.2), endTime: Math.max(0.5, cue.endTime - 0.2) })}
                                title="Nudge 0.2s earlier"
                                className="px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              >
                                -0.2s
                              </button>
                              <button
                                onClick={() => handleUpdateCue(cue.id, { startTime: cue.startTime + 0.2, endTime: cue.endTime + 0.2 })}
                                title="Nudge 0.2s later"
                                className="px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              >
                                +0.2s
                              </button>
                            </div>

                            {/* Snap to current player playhead */}
                            <button
                              onClick={() => handleSnapCue(cue.id, 'start')}
                              title="Snap cue start time to video playhead"
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              Snap Start
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingCueId(editingCueId === cue.id ? null : cue.id)}
                              title="Toggle time scrubbers for this cue"
                              className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSubtitles(prev => prev.filter(c => c.id !== cue.id))}
                              title="Delete cue"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cue Text Input */}
                        <div className="mt-2">
                          <input
                            type="text"
                            value={cue.text}
                            onChange={(e) => handleUpdateCue(cue.id, { text: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        {/* Optional Expanded Individual Cue Time Scroller & Typer */}
                        {editingCueId === cue.id && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-[10px]">
                            <div className="space-y-1">
                              <div className="flex justify-between font-mono text-slate-600 dark:text-slate-300">
                                <span>Start Time (s)</span>
                                <span>{cue.startTime.toFixed(1)}s</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={metadata?.duration || 10}
                                step="0.1"
                                value={cue.startTime}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  handleUpdateCue(cue.id, { startTime: val, endTime: Math.max(val + 0.2, cue.endTime) });
                                }}
                                className="w-full accent-purple-600 h-1 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-mono text-slate-600 dark:text-slate-300">
                                <span>End Time (s)</span>
                                <span>{cue.endTime.toFixed(1)}s</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={metadata?.duration || 10}
                                step="0.1"
                                value={cue.endTime}
                                onChange={(e) => {
                                  const val = Math.max(cue.startTime + 0.1, parseFloat(e.target.value));
                                  handleUpdateCue(cue.id, { endTime: val });
                                }}
                                className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 6. Export, Copy & Hardcode Subtitle Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={handleDownloadSubtitles}
                  disabled={subtitles.length === 0}
                  className="sm:col-span-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File (.{subtitleFormat.toUpperCase()})</span>
                </button>

                <button
                  onClick={handleCopySubtitles}
                  disabled={subtitles.length === 0}
                  className="py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {copiedTranscript ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-purple-600" />
                      <span>Copy Transcript</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBurnInSubtitleSnapshot}
                  disabled={!activeSubtitle}
                  className="py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title="Capture current video frame with hardcoded subtitles"
                >
                  <Camera className="w-4 h-4" />
                  <span>Burn-in Frame Snapshot</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: COLOR GRADING & FILTERS */}
          {activeToolTab === 'filters' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Color Grading & Filter Studio</span>
                </h3>
              </div>

              {/* Preset Filters */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'none', label: 'Original' },
                  { id: 'cinematic', label: 'Cinematic' },
                  { id: 'vintage', label: 'Vintage' },
                  { id: 'bw', label: 'Noir B&W' },
                  { id: 'cyberpunk', label: 'Cyberpunk' },
                  { id: 'vivid', label: 'Vivid' },
                  { id: 'sepia', label: 'Sepia' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilterSettings(prev => ({ ...prev, preset: p.id as any }))}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      filterSettings.preset === p.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Sliders */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Brightness ({filterSettings.brightness}%)</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={filterSettings.brightness}
                    onChange={(e) => setFilterSettings(prev => ({ ...prev, preset: 'none', brightness: parseInt(e.target.value) }))}
                    className="w-32 accent-purple-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contrast ({filterSettings.contrast}%)</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={filterSettings.contrast}
                    onChange={(e) => setFilterSettings(prev => ({ ...prev, preset: 'none', contrast: parseInt(e.target.value) }))}
                    className="w-32 accent-purple-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Saturation ({filterSettings.saturation}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filterSettings.saturation}
                    onChange={(e) => setFilterSettings(prev => ({ ...prev, preset: 'none', saturation: parseInt(e.target.value) }))}
                    className="w-32 accent-purple-600"
                  />
                </div>
              </div>

              <button
                onClick={handleCaptureGradedSnapshot}
                disabled={!videoSrc}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Capture Graded Frame Snapshot</span>
              </button>

              {gradedSnapshotUrl && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between animate-in fade-in">
                  <img src={gradedSnapshotUrl} alt="Graded" className="w-20 h-12 object-cover rounded-lg border" />
                  <a
                    href={gradedSnapshotUrl}
                    download="Graded_Frame.jpg"
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                  >
                    Download Frame
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIO EXTRACTOR */}
          {activeToolTab === 'audio' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-600" />
                  <span>Video to Audio Extractor</span>
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Extract high-definition audio tracks from MP4, WebM, MOV, and AVI videos using the Web Audio API.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Audio Format</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setAudioFormat('wav')}
                      className={`p-3 rounded-xl border text-left ${
                        audioFormat === 'wav'
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold">WAV (Lossless)</p>
                      <p className="text-[10px] text-slate-400">Pure uncompressed audio stream</p>
                    </button>
                    <button
                      onClick={() => setAudioFormat('mp3')}
                      className={`p-3 rounded-xl border text-left ${
                        audioFormat === 'mp3'
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold">MP3 (Compressed)</p>
                      <p className="text-[10px] text-slate-400">Compact universally supported</p>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleExtractAudio}
                  disabled={!videoSrc || isExtractingAudio}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
                >
                  <FileAudio className="w-4 h-4" />
                  <span>{isExtractingAudio ? 'Extracting Audio Track...' : 'Extract & Download Audio'}</span>
                </button>
              </div>

              {extractedAudioUrl && audioStats && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Audio Extracted ({formatBytes(audioStats.size)})</span>
                    </span>
                    <a
                      href={extractedAudioUrl}
                      download={`${(videoFile?.name || 'video').replace(/\.[^/.]+$/, '')}_Audio.wav`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download WAV</span>
                    </a>
                  </div>
                  <audio controls src={extractedAudioUrl} className="w-full h-10 rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STORYBOARD MATRIX */}
          {activeToolTab === 'storyboard' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-purple-600" />
                  <span>Video Storyboard & Keyframe Matrix</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setStoryboardGridType('3x3')}
                  className={`p-3 rounded-xl border text-left ${
                    storyboardGridType === '3x3'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200'
                  }`}
                >
                  <p className="font-bold">3x3 Grid (9 Scenes)</p>
                  <p className="text-[10px] text-slate-400">Standard audit overview</p>
                </button>
                <button
                  onClick={() => setStoryboardGridType('4x4')}
                  className={`p-3 rounded-xl border text-left ${
                    storyboardGridType === '4x4'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200'
                  }`}
                >
                  <p className="font-bold">4x4 Grid (16 Scenes)</p>
                  <p className="text-[10px] text-slate-400">High-density keyframe audit</p>
                </button>
              </div>

              <button
                onClick={handleGenerateStoryboard}
                disabled={!videoSrc || isGeneratingStoryboard}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
              >
                <Grid className="w-4 h-4" />
                <span>{isGeneratingStoryboard ? 'Compiling Storyboard Grid...' : 'Generate Storyboard Image'}</span>
              </button>

              {storyboardUrl && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Storyboard Preview</span>
                    <a
                      href={storyboardUrl}
                      download={`${(videoFile?.name || 'video').replace(/\.[^/.]+$/, '')}_Storyboard.jpg`}
                      className="px-3 py-1 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JPG</span>
                    </a>
                  </div>
                  <img src={storyboardUrl} alt="Storyboard" className="w-full rounded-xl border shadow-xs" />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ASPECT RATIO CROP */}
          {activeToolTab === 'aspect' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Crop className="w-4 h-4 text-purple-600" />
                  <span>Social Media Aspect Ratio Formatter</span>
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: '9:16', label: '9:16 Vertical', icon: Smartphone, desc: 'TikTok, Reels, Shorts' },
                  { id: '1:1', label: '1:1 Square', icon: Square, desc: 'Instagram & Feed' },
                  { id: '16:9', label: '16:9 Landscape', icon: Tv, desc: 'YouTube & Desktop' }
                ].map(r => {
                  const Icon = r.icon;
                  const isSelected = targetAspect === r.id;

                  return (
                    <button
                      key={r.id}
                      onClick={() => setTargetAspect(r.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-purple-600 mb-1" />
                      <p className="font-bold">{r.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{r.desc}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleGenerateAspectCrop}
                disabled={!videoSrc || isAspectProcessing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
              >
                <Crop className="w-4 h-4" />
                <span>Format Current Frame to {targetAspect}</span>
              </button>

              {aspectCroppedUrl && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{targetAspect} Cropped Snapshot</span>
                    <a
                      href={aspectCroppedUrl}
                      download={`Video_Crop_${targetAspect.replace(':', 'x')}.jpg`}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs"
                    >
                      Download Crop
                    </a>
                  </div>
                  <div className="flex justify-center max-h-48 overflow-hidden rounded-xl">
                    <img src={aspectCroppedUrl} alt="Cropped" className="object-contain max-h-48 rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SPEED & SLOW-MO */}
          {activeToolTab === 'speed' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-600" />
                  <span>Playback Speed & Timelapse Adjuster</span>
                </h3>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                {[0.25, 0.5, 1.0, 1.5, 2.0, 4.0].map(s => (
                  <button
                    key={s}
                    onClick={() => handleChangeSpeed(s)}
                    className={`py-2.5 rounded-xl border font-bold text-center transition-all ${
                      playbackRate === s
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s === 1.0 ? '1.0x Normal' : `${s}x`}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                ⚡ <strong>Active Playback: {playbackRate}x</strong> — Adjust speed in real-time with preserved audio pitch algorithms.
              </div>
            </div>
          )}

        </div>

      </div>
      )}

      {/* 4. EXTRACTED SEQUENTIAL IMAGES GALLERY (Rendered when frames exist) */}
      {frames.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Extracted Sequential Images ({frames.length} Frames)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Browse through sequential frames. Click any image for full-screen sequential lightbox viewer.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGenerateContactSheet}
                disabled={isGeneratingSheet}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{isGeneratingSheet ? 'Generating...' : 'Contact Sheet Matrix'}</span>
              </button>

              <button
                onClick={handleDownloadFramesZip}
                disabled={isDownloadingFrames}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:cursor-wait disabled:opacity-70"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>{isDownloadingFrames ? 'Preparing ZIP...' : 'Download All (ZIP)'}</span>
              </button>

              <button
                onClick={() => setFrames([])}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
                title="Clear All Frames"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sequential Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
            {frames.map((frame, idx) => (
              <div
                key={frame.id}
                className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden hover:border-purple-400 transition-all cursor-pointer shadow-xs"
                onClick={() => setLightboxIndex(idx)}
              >
                <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={frame.dataUrl}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Index Pill */}
                <div className="absolute top-2 left-2 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-black/75 text-white text-[9px] font-mono font-bold tracking-wider backdrop-blur-xs">
                    #{String(idx + 1).padStart(3, '0')}
                  </span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(idx);
                    }}
                    className="p-2 rounded-xl bg-white text-slate-900 shadow-md transform hover:scale-110 transition-transform"
                    title="Sequential View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingleFrame(frame, idx);
                    }}
                    className="p-2 rounded-xl bg-purple-600 text-white shadow-md transform hover:scale-110 transition-transform cursor-pointer"
                    title="Download Frame"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Time & Sharpness Info */}
                <div className="p-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{frame.formattedTime}</span>
                  <span className="text-emerald-600 font-bold">Q: {frame.sharpnessScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FULL-SCREEN SEQUENTIAL LIGHTBOX MODAL */}
      {lightboxIndex !== null && frames[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Top Header */}
          <div
            className="flex items-center justify-between text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              <h4 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Sequential Frame Viewer</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-600 text-white">
                  {lightboxIndex + 1} / {frames.length}
                </span>
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Timestamp: {frames[lightboxIndex].formattedTime} • Res: {frames[lightboxIndex].width}x{frames[lightboxIndex].height} • Sharpness: {frames[lightboxIndex].sharpnessScore}% • Size: {formatBytes(frames[lightboxIndex].sizeBytes)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSingleFrame(frames[lightboxIndex], lightboxIndex)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Frame</span>
              </button>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image with Left/Right Chevrons */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex(prev => (prev !== null ? (prev > 0 ? prev - 1 : frames.length - 1) : 0))}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-transform hover:scale-110"
              title="Previous Frame (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={frames[lightboxIndex].dataUrl}
              alt={`Frame ${lightboxIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            <button
              onClick={() => setLightboxIndex(prev => (prev !== null ? (prev < frames.length - 1 ? prev + 1 : 0) : 0))}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-transform hover:scale-110"
              title="Next Frame (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Thumbnail Filmstrip Carousel */}
          <div
            className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-thin border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {frames.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => setLightboxIndex(idx)}
                className={`relative shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                  lightboxIndex === idx ? 'border-purple-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={f.dataUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 px-1 text-[8px] font-mono bg-black/80 text-white rounded-tl">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. CONTACT SHEET MODAL */}
      {contactSheetUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setContactSheetUrl(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-600" />
                <span>Sequential Frame Contact Sheet Matrix</span>
              </h4>
              <button
                onClick={() => setContactSheetUrl(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border bg-black flex items-center justify-center p-2">
              <img src={contactSheetUrl} alt="Contact Sheet" className="max-w-full rounded-xl object-contain shadow-md" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={contactSheetUrl}
                download="Contact_Sheet.jpg"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Contact Sheet</span>
              </a>
              <button
                onClick={() => setContactSheetUrl(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
