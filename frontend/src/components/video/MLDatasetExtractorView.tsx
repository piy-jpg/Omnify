import React, { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Upload,
  Play,
  Pause,
  Sliders,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  FileArchive,
  Eye,
  Trash2,
  RefreshCw,
  Check,
  Zap,
  Info,
  ShieldCheck,
  Cpu,
  Target,
  Image,
  FolderTree,
  FileCode,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MLFrameworkPreset,
  MLDatasetConfig,
  MLDtsFrame,
  MLDatasetProgress,
  ML_PRESETS,
  extractMLDatasetFrames,
  bundleAndDownloadMLDataset
} from '../../services/video/mlDatasetEngine';
import { generateDemoVideoBlob } from '../../services/videoFrameEngine';
import { formatBytes } from '../../utils/formatters';

interface MLDatasetExtractorViewProps {
  initialVideoFile?: File | null;
}

export const MLDatasetExtractorView: React.FC<MLDatasetExtractorViewProps> = ({ initialVideoFile }) => {
  // Video Source States
  const [videoFile, setVideoFile] = useState<File | null>(initialVideoFile || null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);

  // Configuration States
  const [config, setConfig] = useState<MLDatasetConfig>({
    preset: 'yolo',
    targetResolution: { width: 640, height: 640 },
    aspectMode: 'pad_square',
    samplingMethod: 'interval',
    samplingValue: 0.5,
    filterBlur: true,
    minSharpnessScore: 35,
    deduplicate: true,
    dedupThreshold: 0.08,
    splitRatio: { train: 80, val: 10, test: 10 },
    outputFormat: 'image/jpeg',
    imageQuality: 0.92,
    namingPrefix: 'yolo_frame',
    datasetName: 'yolo_model_dataset',
    classNames: ['object', 'target'],
    loraTriggerWord: 'tok_subject'
  });

  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'train' | 'val' | 'test'>('all');
  const [classInputText, setClassInputText] = useState('object, target');

  // Execution & Progress States
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<MLDatasetProgress | null>(null);
  const [frames, setFrames] = useState<MLDtsFrame[]>([]);
  const [previewingFrame, setPreviewingFrame] = useState<MLDtsFrame | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Sync with initialVideoFile from parent
  useEffect(() => {
    if (initialVideoFile) {
      setVideoFile(initialVideoFile);
    }
  }, [initialVideoFile]);

  // Update video source on file change
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      setFrames([]);
      setProgress(null);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  // Load Synthetic Demo Video
  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const demoBlob = await generateDemoVideoBlob();
      const demoFile = new File([demoBlob], 'Sample_AI_Dataset_Video.webm', { type: 'video/webm' });
      setVideoFile(demoFile);
    } catch (e) {
      console.error('Demo video generation failed', e);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Handle Preset Change
  const handlePresetSelect = (preset: MLFrameworkPreset) => {
    const pInfo = ML_PRESETS[preset];
    setConfig(prev => ({
      ...prev,
      preset,
      targetResolution: { width: pInfo.recommendedWidth, height: pInfo.recommendedHeight },
      aspectMode: pInfo.aspectMode,
      outputFormat: pInfo.outputFormat,
      namingPrefix: preset === 'yolo' ? 'yolo_frame' : preset === 'lora_diffusion' ? 'lora_img' : preset === 'opencv_tracking' ? 'seq_frame' : 'frame',
      datasetName: `${preset}_model_dataset`,
      loraTriggerWord: prev.loraTriggerWord || 'tok_subject'
    }));
  };

  // Sync Class Names from input
  const handleClassInputChange = (val: string) => {
    setClassInputText(val);
    const parsed = val.split(',').map(s => s.trim()).filter(Boolean);
    setConfig(prev => ({
      ...prev,
      classNames: parsed.length > 0 ? parsed : ['object']
    }));
  };

  // Video Metadata Loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 10);
      setVideoWidth(videoRef.current.videoWidth || 1920);
      setVideoHeight(videoRef.current.videoHeight || 1080);
    }
  };

  // Start Extraction
  const handleStartExtraction = async () => {
    let currentVideo = videoFile;
    if (!currentVideo) {
      setIsLoadingDemo(true);
      try {
        const demoBlob = await generateDemoVideoBlob();
        currentVideo = new File([demoBlob], 'Sample_AI_Dataset_Video.webm', { type: 'video/webm' });
        setVideoFile(currentVideo);
      } catch (e) {
        console.error('Demo video generation failed', e);
        setIsLoadingDemo(false);
        return;
      } finally {
        setIsLoadingDemo(false);
      }
    }

    setIsExtracting(true);
    cancelRef.current = false;
    setFrames([]);

    try {
      let vEl = videoRef.current;
      if (!vEl) {
        vEl = document.createElement('video');
        vEl.muted = true;
        vEl.playsInline = true;
        vEl.preload = 'auto';
      }

      if (!vEl.src || vEl.src.length === 0) {
        const url = URL.createObjectURL(currentVideo);
        vEl.src = url;
      }

      if (vEl.readyState < 2) {
        await new Promise<void>((resolve) => {
          vEl!.onloadeddata = () => resolve();
          vEl!.onloadedmetadata = () => resolve();
          vEl!.oncanplay = () => resolve();
          setTimeout(resolve, 1500);
        });
      }

      const extracted = await extractMLDatasetFrames(
        vEl,
        currentVideo,
        config,
        (p) => setProgress(p),
        () => cancelRef.current
      );

      setFrames(extracted);
      if (extracted.length > 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('ML Frame Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Bundle Dataset ZIP
  const handleDownloadDatasetZip = async () => {
    if (frames.length === 0) return;
    setIsZipping(true);
    try {
      await bundleAndDownloadMLDataset(frames, config, videoFile?.name || 'source_video.mp4');
      confetti({ particleCount: 80, spread: 70 });
    } catch (err) {
      console.error('Failed to bundle dataset ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Filtered frames by split group
  const visibleFrames = frames.filter(f => {
    if (activeFilterTab === 'all') return true;
    return f.splitGroup === activeFilterTab;
  });

  const activePresetInfo = ML_PRESETS[config.preset];

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200/80 dark:border-purple-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI & ML Model Training Dataset Extractor</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                CV & Deep Learning
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Convert video clips into clean, deduplicated, and normalized image datasets structured for <strong>YOLO, PyTorch, TensorFlow, LoRA, and OpenCV</strong> training.
          </p>
          {videoFile && (
            <div className="flex items-center gap-3 pt-1 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <strong>{videoFile.name}</strong> ({formatBytes(videoFile.size)})
              </span>
              {videoWidth > 0 && (
                <span>• {videoWidth}×{videoHeight} • {videoDuration.toFixed(1)}s</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleLoadDemo}
            disabled={isLoadingDemo || isExtracting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isLoadingDemo ? 'Generating Sample...' : 'Try Sample Video'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi"
            onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{videoFile ? 'Change Video' : 'Upload Video File'}</span>
          </button>
        </div>
      </div>

      {/* 2. OFF-SCREEN VIDEO PLAYER FOR HARDWARE CANVAS DECODING */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          onLoadedMetadata={handleLoadedMetadata}
          muted
          playsInline
          preload="auto"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '320px',
            height: '240px',
            opacity: 0.01,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 3. ML FRAMEWORK PRESETS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(ML_PRESETS) as MLFrameworkPreset[]).map(presetKey => {
          const item = ML_PRESETS[presetKey];
          const isSelected = config.preset === presetKey;

          return (
            <button
              key={presetKey}
              onClick={() => handlePresetSelect(presetKey)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/90 dark:bg-purple-950/70 shadow-sm ring-2 ring-purple-500/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.tag}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                </div>
                
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  {item.name}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300">
                  {item.recommendedWidth} × {item.recommendedHeight}
                </span>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 uppercase tracking-wider">
                  {item.outputFormat.split('/')[1]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. DYNAMIC FRAMEWORK CONFIGURATION & QUALITY PIPELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FRAMEWORK SPECIALIZED PARAMETERS & RESOLUTION */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>1. {activePresetInfo.name} Framework Settings</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                {config.preset.toUpperCase()}
              </span>
            </div>

            {/* Framework-Specific Controls */}
            {config.preset === 'yolo' && (
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>YOLO Class Names (Comma Separated)</span>
                  </label>
                  <input
                    type="text"
                    value={classInputText}
                    onChange={(e) => handleClassInputChange(e.target.value)}
                    placeholder="person, vehicle, license_plate"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">
                    Generates <code>data.yaml</code> and <code>classes.txt</code> with classes: {config.classNames.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Quick Res:</span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 640, height: 640 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 640 ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    640×640 (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 1280, height: 1280 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 1280 ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    1280×1280 (HD)
                  </button>
                </div>
              </div>
            )}

            {config.preset === 'classification' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Primary Class / Category Subdirectory</span>
                  </label>
                  <input
                    type="text"
                    value={classInputText}
                    onChange={(e) => handleClassInputChange(e.target.value)}
                    placeholder="target_class"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    Outputs images into <code>train/{config.classNames[0] || 'class_1'}/</code> with PyTorch <code>dataset.py</code> loader.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Quick Res:</span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 224, height: 224 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 224 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    224×224 (ViT/ResNet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 384, height: 384 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 384 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    384×384 (Large ViT)
                  </button>
                </div>
              </div>
            )}

            {config.preset === 'lora_diffusion' && (
              <div className="p-3.5 rounded-2xl bg-pink-50/50 dark:bg-pink-950/30 border border-pink-200/60 dark:border-pink-900/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-pink-900 dark:text-pink-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>LoRA Training Trigger Word</span>
                  </label>
                  <input
                    type="text"
                    value={config.loraTriggerWord}
                    onChange={(e) => setConfig(prev => ({ ...prev, loraTriggerWord: e.target.value }))}
                    placeholder="tok_subject"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-pink-600 dark:text-pink-400">
                    Each image will be paired with a corresponding <code>.txt</code> prompt caption containing <code>{config.loraTriggerWord}</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Quick Res:</span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 512, height: 512 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 512 ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    512×512 (SD 1.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 768, height: 768 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 768 ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    768×768 (SD 2.1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 1024, height: 1024 } }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 1024 ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    1024×1024 (SDXL)
                  </button>
                </div>
              </div>
            )}

            {config.preset === 'opencv_tracking' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sequence Frame Prefix</span>
                  </label>
                  <input
                    type="text"
                    value={config.namingPrefix}
                    onChange={(e) => setConfig(prev => ({ ...prev, namingPrefix: e.target.value }))}
                    placeholder="seq_frame"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Outputs continuous sequential frames + <code>sequence_manifest.json</code> + <code>opencv_loader.py</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Quick Res:</span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 1280, height: 720 }, aspectMode: 'original' }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 1280 ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    1280×720 (HD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetResolution: { width: 1920, height: 1080 }, aspectMode: 'original' }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.targetResolution.width === 1920 ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    1920×1080 (FHD)
                  </button>
                </div>
              </div>
            )}

            {config.preset === 'custom' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Dataset Name
                    </label>
                    <input
                      type="text"
                      value={config.datasetName}
                      onChange={(e) => setConfig(prev => ({ ...prev, datasetName: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      File Naming Prefix
                    </label>
                    <input
                      type="text"
                      value={config.namingPrefix}
                      onChange={(e) => setConfig(prev => ({ ...prev, namingPrefix: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resolution & Aspect Ratio Controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Target Resolution (W × H)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.targetResolution.width}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      targetResolution: { ...prev.targetResolution, width: parseInt(e.target.value) || 640 }
                    }))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    value={config.targetResolution.height}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      targetResolution: { ...prev.targetResolution, height: parseInt(e.target.value) || 640 }
                    }))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Aspect Ratio Fit Mode
                </label>
                <select
                  value={config.aspectMode}
                  onChange={(e) => setConfig(prev => ({ ...prev, aspectMode: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pad_square">Pad Square / Letterbox (YOLO Standard)</option>
                  <option value="center_crop">Center Crop Square (ViT / LoRA)</option>
                  <option value="original">Preserve Original Aspect (OpenCV)</option>
                </select>
              </div>
            </div>

            {/* Sampling Strategy */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Sampling Strategy
                </label>
                <select
                  value={config.samplingMethod}
                  onChange={(e) => setConfig(prev => ({ ...prev, samplingMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="interval">Time Interval (Seconds)</option>
                  <option value="fps">Sample Rate (FPS)</option>
                  <option value="total_frames">Exact Total Frame Count</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {config.samplingMethod === 'interval' ? 'Interval (Seconds)' : config.samplingMethod === 'fps' ? 'Frames Per Second' : 'Target Frame Count'}
                </label>
                <input
                  type="number"
                  step={0.1}
                  value={config.samplingValue}
                  onChange={(e) => setConfig(prev => ({ ...prev, samplingValue: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI QUALITY FILTERS & SPLIT PROPORTIONS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>2. Quality Cleaning & Train/Val Split</span>
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Laplacian Blur Filtering
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Automatically discard motion-blurred or out-of-focus frames
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.filterBlur}
                  onChange={(e) => setConfig(prev => ({ ...prev, filterBlur: e.target.checked }))}
                  className="rounded text-purple-600 accent-purple-600 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Duplicate Frame Suppression
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Eliminate consecutive near-identical frames to prevent model overfitting
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.deduplicate}
                  onChange={(e) => setConfig(prev => ({ ...prev, deduplicate: e.target.checked }))}
                  className="rounded text-purple-600 accent-purple-600 w-4 h-4"
                />
              </label>
            </div>

            {/* Train / Val / Test Split Controls */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span>Train / Val / Test Distribution</span>
                <span className="font-mono text-purple-600 font-bold">
                  {config.splitRatio.train}% Train • {config.splitRatio.val}% Val • {config.splitRatio.test}% Test
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, splitRatio: { train: 80, val: 10, test: 10 } }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${config.splitRatio.train === 80 ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  80 / 10 / 10
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, splitRatio: { train: 70, val: 20, test: 10 } }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${config.splitRatio.train === 70 ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  70 / 20 / 10
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, splitRatio: { train: 100, val: 0, test: 0 } }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${config.splitRatio.train === 100 ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  100% All Train
                </button>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleStartExtraction}
              disabled={isExtracting || isLoadingDemo}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting AI Training Frames...</span>
                </>
              ) : isLoadingDemo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Sample Video...</span>
                </>
              ) : !videoFile ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Try Sample Video & Generate ML Dataset ({activePresetInfo.shortLabel})</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Generate ML Dataset ({activePresetInfo.shortLabel})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. EXTRACTION PROGRESS BAR */}
      {isExtracting && progress && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {progress.statusMessage}
            </span>
            <span className="font-bold text-purple-600 font-mono">
              {progress.percentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-200"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Accepted: <strong className="text-emerald-600">{progress.acceptedCount}</strong></span>
            <span>Blur Filtered: <strong className="text-amber-600">{progress.rejectedBlurCount}</strong></span>
            <span>Duplicate Suppressed: <strong className="text-slate-400">{progress.rejectedDupCount}</strong></span>
          </div>
        </div>
      )}

      {/* 6. EXTRACTED DATASET GALLERY & EXPORT SECTION */}
      {frames.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          
          {/* Gallery Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>ML Training Dataset Ready ({frames.length} Images)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Structured for {config.preset.toUpperCase()} • {frames.filter(f => f.splitGroup === 'train').length} Train • {frames.filter(f => f.splitGroup === 'val').length} Val • {frames.filter(f => f.splitGroup === 'test').length} Test
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['all', 'train', 'val', 'test'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilterTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      activeFilterTab === tab
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ZIP Download Button */}
              <button
                onClick={handleDownloadDatasetZip}
                disabled={isZipping}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileArchive className="w-4 h-4" />
                <span>{isZipping ? 'Packaging Dataset...' : 'Download ML Dataset ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {visibleFrames.slice(0, 48).map((frame) => (
              <div
                key={frame.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
              >
                <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={frame.dataUrl}
                    alt={frame.fileName}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Badge for Split Group */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    frame.splitGroup === 'train'
                      ? 'bg-blue-600 text-white'
                      : frame.splitGroup === 'val'
                      ? 'bg-purple-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {frame.splitGroup}
                  </span>
                </div>

                {/* Bottom Metadata */}
                <div className="p-2 space-y-0.5">
                  <div className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                    {frame.fileName}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{frame.formattedTime}</span>
                    <span className="text-emerald-500">Q: {frame.sharpness}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {visibleFrames.length > 48 && (
            <div className="text-center text-xs text-slate-400 pt-2">
              Showing 48 of {visibleFrames.length} images. All images will be included in the downloaded dataset ZIP.
            </div>
          )}

        </div>
      )}

    </div>
  );
};
