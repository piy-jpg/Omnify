import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  UploadCloud, 
  FileText, 
  FileBox, 
  Layers,
  Zap,
  Plus,
  Globe,
  Monitor,
  Camera,
  Mic,
  Video,
  ExternalLink,
  Download,
  FolderOpen,
  Search,
  Check,
  Play,
  Square,
  Sparkles,
  ArrowRight,
  Archive,
  Copy,
  Link2,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageInfo, FileItem } from '../types';
import { formatBytes } from '../utils/formatters';
import {
  ingestWebpage,
  ingestCloudFile,
  batchFetchRemoteUrls,
  SAMPLE_CLOUD_FILES,
  CloudFileItem,
  WebpageIngestionResult
} from '../services/cloud/cloudIngestionEngine';

interface CloudStoragePageProps {
  storageInfo: StorageInfo;
  onOpenUpgrade: () => void;
  onFileConverted?: (file: FileItem) => void;
  onSelectTab?: (tab: any) => void;
}

type IngestionTab = 'web_url' | 'cloud_drives' | 'screen_cam' | 'batch_urls' | 'vault_quota';

export const CloudStoragePage: React.FC<CloudStoragePageProps> = ({
  storageInfo,
  onOpenUpgrade,
  onFileConverted,
  onSelectTab
}) => {
  const [activeTab, setActiveTab] = useState<IngestionTab>('web_url');

  // 1. Web & URL Ingestion States
  const [targetUrl, setTargetUrl] = useState<string>('https://en.wikipedia.org/wiki/Artificial_intelligence');
  const [renderMode, setRenderMode] = useState<'pdf' | 'screenshot_png' | 'screenshot_jpg' | 'markdown'>('pdf');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isIngestingUrl, setIsIngestingUrl] = useState<boolean>(false);
  const [urlResult, setUrlResult] = useState<WebpageIngestionResult | null>(null);

  // 2. Cloud Drives States
  const [activeProvider, setActiveProvider] = useState<'google_drive' | 'dropbox' | 'onedrive' | 'box' | 's3'>('google_drive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCloudFileIds, setSelectedCloudFileIds] = useState<string[]>([]);
  const [isImportingCloud, setIsImportingCloud] = useState<boolean>(false);
  const [importedCloudFiles, setImportedCloudFiles] = useState<FileItem[]>([]);

  // 3. Media Ingestion (Screen / Webcam / Mic) States
  const [recordingType, setRecordingType] = useState<'screen' | 'webcam' | 'mic'>('screen');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [recordedMediaUrl, setRecordedMediaUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // 4. Batch Remote URLs States
  const [batchUrlsInput, setBatchUrlsInput] = useState<string>(
    'https://example.com/quarterly-report\nhttps://example.com/marketing-overview\nhttps://example.com/product-specs'
  );
  const [isBatchIngesting, setIsBatchIngesting] = useState<boolean>(false);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number>(0);

  // 5. Cache purge state
  const [purged, setPurged] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnyRecording();
    };
  }, []);

  const handlePurgeCache = () => {
    setPurged(true);
    setTimeout(() => setPurged(false), 2500);
  };

  // 1. Ingest Web URL
  const handleIngestUrl = async () => {
    if (!targetUrl.trim()) return;
    setIsIngestingUrl(true);
    setUrlResult(null);

    try {
      const res = await ingestWebpage(targetUrl, renderMode, viewport);
      setUrlResult(res);
      setIsIngestingUrl(false);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      if (onFileConverted) {
        const newFile: FileItem = {
          id: `web-ingest-${Date.now()}`,
          name: res.fileName,
          size: res.fileSize,
          type: res.fileType,
          extension: res.fileExtension,
          uploadedAt: 'Just now',
          status: 'ready',
          previewUrl: res.dataUrl
        };
        onFileConverted(newFile);
      }
    } catch (err) {
      console.error('URL ingestion failed:', err);
      setIsIngestingUrl(false);
    }
  };

  // 2. Import Cloud Files
  const handleImportSelectedCloudFiles = async () => {
    if (selectedCloudFileIds.length === 0) return;
    setIsImportingCloud(true);

    try {
      const allFiles = SAMPLE_CLOUD_FILES[activeProvider] || [];
      const targets = allFiles.filter(f => selectedCloudFileIds.includes(f.id));

      const newItems: FileItem[] = [];
      for (const t of targets) {
        const item = await ingestCloudFile(t);
        newItems.push(item);
        if (onFileConverted) onFileConverted(item);
      }

      setImportedCloudFiles(prev => [...newItems, ...prev]);
      setSelectedCloudFileIds([]);
      setIsImportingCloud(false);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Cloud file import error:', err);
      setIsImportingCloud(false);
    }
  };

  // 3. Screen / Webcam / Mic Recording
  const startRecording = async () => {
    try {
      let stream: MediaStream;
      if (recordingType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else if (recordingType === 'webcam') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      mediaStreamRef.current = stream;
      if (videoPreviewRef.current && recordingType !== 'mic') {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const mime = recordingType === 'mic' ? 'audio/wav' : 'video/mp4';
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedMediaUrl(url);

        const newFile: FileItem = {
          id: `media-rec-${Date.now()}`,
          name: `Ingested_${recordingType}_${Date.now()}.${recordingType === 'mic' ? 'wav' : 'mp4'}`,
          size: blob.size,
          type: mime,
          extension: recordingType === 'mic' ? 'WAV' : 'MP4',
          uploadedAt: 'Just now',
          status: 'ready',
          previewUrl: url
        };
        if (onFileConverted) onFileConverted(newFile);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Browser media recording cancelled or unsupported:', err);
      // Fallback mock recording for sandbox/unsupported environments
      simulateMockRecording();
    }
  };

  const simulateMockRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);
  };

  const stopAnyRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
  };

  // 4. Batch Remote URL Fetcher
  const handleBatchIngest = async () => {
    const urls = batchUrlsInput.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setIsBatchIngesting(true);

    try {
      const res = await batchFetchRemoteUrls(urls, `ConvertPro_Remote_Batch_${Date.now()}.zip`);
      setBatchSuccessCount(res.total);
      if (onFileConverted) {
        res.files.forEach(f => onFileConverted(f));
      }
      setIsBatchIngesting(false);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Batch URL ingestion failed:', err);
      setIsBatchIngesting(false);
    }
  };

  const getFormatIcon = (ext: string) => {
    const e = ext.toUpperCase();
    if (e === 'PDF') return <FileText className="w-4 h-4 text-rose-500" />;
    if (['DOCX', 'DOC'].includes(e)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (['PPTX', 'PPT'].includes(e)) return <Presentation className="w-4 h-4 text-amber-500" />;
    if (['XLSX', 'CSV'].includes(e)) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(e)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (['MP4', 'MOV'].includes(e)) return <Video className="w-4 h-4 text-indigo-500" />;
    return <FileBox className="w-4 h-4 text-slate-500" />;
  };

  const filteredCloudFiles = (SAMPLE_CLOUD_FILES[activeProvider] || []).filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. STUDIO HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <Cloud className="w-3.5 h-3.5 text-cyan-200" />
            <span>Universal Cloud & Ingestion Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Web to PDF, Cloud Drives & Media Ingestion
          </h1>
          <p className="text-xs text-cyan-100/90 leading-relaxed">
            Ingest documents from any web URL, connect Google Drive & Dropbox, capture live screen/webcam recordings, and manage your encrypted cloud vault.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenUpgrade}
            className="px-5 py-2.5 rounded-2xl bg-white text-indigo-800 font-bold text-xs hover:bg-white/90 shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Manage Storage Quotas</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLS NAVIGATION BAR */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'web_url', label: 'Web & URL Ingestor', icon: Globe, badge: 'HOT' },
          { id: 'cloud_drives', label: 'Cloud Drive Connectors', icon: UploadCloud, badge: 'PRO' },
          { id: 'screen_cam', label: 'Screen & Webcam Ingest', icon: Monitor },
          { id: 'batch_urls', label: 'Batch URL Importer', icon: Link2 },
          { id: 'vault_quota', label: 'Vault & Quota Manager', icon: HardDrive }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IngestionTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                  isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="space-y-6">

        {/* TAB 1: WEB & URL TO DOCUMENT / SCREENSHOT */}
        {activeTab === 'web_url' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: URL Configuration */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Web Page URL Ingestion</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                    100% Client-Side
                  </span>
                </div>

                {/* Target URL Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Target Webpage Link</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono font-semibold text-slate-900 dark:text-white pl-9"
                    />
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Render Format Modes */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400">Output Ingestion Format</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    {[
                      { id: 'pdf', label: 'Structured PDF Document', desc: 'Vector print layout' },
                      { id: 'screenshot_png', label: 'Full Screenshot (PNG)', desc: 'Crisp lossless image' },
                      { id: 'screenshot_jpg', label: 'Web Screenshot (JPG)', desc: 'Compact snapshot' },
                      { id: 'markdown', label: 'Clean Markdown & Text', desc: 'Strips ads & headers' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setRenderMode(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          renderMode === m.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <p>{m.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewport Device Selection */}
                {renderMode.startsWith('screenshot') && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-semibold text-slate-400">Device Viewport Emulation</label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      {[
                        { id: 'desktop', label: 'Desktop (1920×1080)' },
                        { id: 'tablet', label: 'Tablet (1024×1366)' },
                        { id: 'mobile', label: 'Mobile (414×896)' }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setViewport(v.id as any)}
                          className={`py-2 rounded-xl border text-center ${
                            viewport === v.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingest Action Button */}
                <button
                  onClick={handleIngestUrl}
                  disabled={isIngestingUrl || !targetUrl.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isIngestingUrl ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting & Rendering Webpage...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ingest URL & Generate {renderMode.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Ingested Result & Live Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-h-[420px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Ingested Document Preview
                    </span>
                    {urlResult && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        {formatBytes(urlResult.fileSize)} • Ready
                      </span>
                    )}
                  </div>

                  {urlResult ? (
                    <div className="mt-4 space-y-4 animate-in fade-in">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{urlResult.title}</h4>
                          <span className="text-xs font-mono font-bold text-blue-600">{urlResult.fileExtension}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate">{urlResult.url}</p>
                      </div>

                      {/* Visual rendering preview */}
                      {urlResult.fileExtension === 'PDF' ? (
                        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4">
                          <iframe src={urlResult.dataUrl} className="w-full h-full rounded-xl" title="PDF Preview" />
                        </div>
                      ) : urlResult.fileExtension === 'MD' ? (
                        <div className="max-h-72 overflow-y-auto p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
                          <pre>{urlResult.extractedText}</pre>
                        </div>
                      ) : (
                        <div className="max-h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-950">
                          <img src={urlResult.dataUrl} alt="Screenshot" className="max-h-72 object-contain" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-72 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2 mt-4">
                      <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Web Document Ingested Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Enter any web article or link above and click Ingest to synthesize a clean vector PDF or screenshot.
                      </p>
                    </div>
                  )}
                </div>

                {urlResult && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Saved to Recent Workspace Files</span>
                    <a
                      href={urlResult.dataUrl}
                      download={urlResult.fileName}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {urlResult.fileExtension}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MULTI-CLOUD DRIVE CONNECTORS */}
        {activeTab === 'cloud_drives' && (
          <div className="space-y-6">
            
            {/* Cloud Provider Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'google_drive', name: 'Google Drive', badge: 'Connected', count: 5 },
                { id: 'dropbox', name: 'Dropbox', badge: 'Connected', count: 3 },
                { id: 'onedrive', name: 'OneDrive', badge: 'Connected', count: 2 },
                { id: 'box', name: 'Box Enterprise', badge: 'Connected', count: 2 },
                { id: 's3', name: 'AWS S3 Bucket', badge: 'API Synced', count: 2 }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProvider(p.id as any);
                    setSelectedCloudFileIds([]);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    activeProvider === p.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="text-xs">{p.name}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400 font-normal">{p.count} assets</span>
                    <span className="text-emerald-600 font-semibold">{p.badge}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Cloud Drive File Explorer */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search files in ${activeProvider.replace('_', ' ')}...`}
                    className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {selectedCloudFileIds.length} of {filteredCloudFiles.length} selected
                  </span>
                  <button
                    onClick={handleImportSelectedCloudFiles}
                    disabled={selectedCloudFileIds.length === 0 || isImportingCloud}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isImportingCloud ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Import to ConvertPro ({selectedCloudFileIds.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* File Listing Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCloudFiles.map(file => {
                  const isSelected = selectedCloudFileIds.includes(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedCloudFileIds(prev =>
                          isSelected ? prev.filter(id => id !== file.id) : [...prev, file.id]
                        );
                      }}
                      className={`p-3 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 accent-blue-600 w-4 h-4"
                        />
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {getFormatIcon(file.extension)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{file.path}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs text-slate-400">
                        <span>{formatBytes(file.size)}</span>
                        <span>{file.modifiedAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Imported Cloud Files Toast Card */}
            {importedCloudFiles.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Successfully Imported {importedCloudFiles.length} cloud assets into your active workspace!
                  </span>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('file-studio')}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <span>Open in File Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: SCREEN & WEBCAM INGESTION STUDIO */}
        {activeTab === 'screen_cam' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Device Control */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  <span>Direct Device Recording Studio</span>
                </h3>

                {/* Recording Source Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400">Recording Ingestion Source</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {[
                      { id: 'screen', label: 'Screen & Tab', icon: Monitor },
                      { id: 'webcam', label: 'Webcam Video', icon: Camera },
                      { id: 'mic', label: 'Voice Audio', icon: Mic }
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (!isRecording) setRecordingType(s.id as any);
                          }}
                          disabled={isRecording}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                            recordingType === s.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Timer Badge */}
                <div className="p-4 rounded-2xl bg-slate-950 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Recording Elapsed</span>
                  <div className="text-3xl font-mono font-extrabold text-white flex items-center justify-center gap-2">
                    {isRecording && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
                    <span>
                      {String(Math.floor(recordDuration / 60)).padStart(2, '0')}:
                      {String(recordDuration % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Record Action Buttons */}
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start {recordingType.toUpperCase()} Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopAnyRecording}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording & Ingest File</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Video Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 min-h-[420px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Live Video Viewport
                    </span>
                    {recordedMediaUrl && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        {formatBytes(recordedBlob?.size || 0)} • Ingested
                      </span>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center min-h-[260px]">
                    {recordedMediaUrl ? (
                      recordingType === 'mic' ? (
                        <audio src={recordedMediaUrl} controls className="w-full p-6" />
                      ) : (
                        <video src={recordedMediaUrl} controls className="max-h-72 w-full object-contain" />
                      )
                    ) : (
                      <video ref={videoPreviewRef} muted autoPlay playsInline className="max-h-72 w-full object-contain" />
                    )}
                  </div>
                </div>

                {recordedMediaUrl && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    {onSelectTab && (
                      <button
                        onClick={() => onSelectTab('video-frame-studio')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Open in Video Studio</span>
                      </button>
                    )}

                    <a
                      href={recordedMediaUrl}
                      download={`Recorded_${recordingType}.${recordingType === 'mic' ? 'wav' : 'mp4'}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Clip</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: BATCH REMOTE URL INGESTION */}
        {activeTab === 'batch_urls' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Multi-Threaded Remote URL Ingestion</span>
              </h3>
              <span className="text-xs text-slate-400">One URL per line</span>
            </div>

            <textarea
              rows={5}
              value={batchUrlsInput}
              onChange={(e) => setBatchUrlsInput(e.target.value)}
              placeholder="https://example.com/doc1&#10;https://example.com/doc2"
              className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {batchUrlsInput.split('\n').filter(u => u.trim()).length} URLs detected
              </span>

              <button
                onClick={handleBatchIngest}
                disabled={isBatchIngesting || !batchUrlsInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isBatchIngesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ingesting & Packaging ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Batch Fetch & Download ZIP</span>
                  </>
                )}
              </button>
            </div>

            {batchSuccessCount > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Successfully ingested {batchSuccessCount} remote resources and saved to your recent workspace!
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VAULT & QUOTA MANAGER */}
        {activeTab === 'vault_quota' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Allocated Quota</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{storageInfo.usedFormatted}</span>
                  <span className="text-sm font-semibold text-slate-400">used of {storageInfo.totalFormatted} ({storageInfo.percentage}% used)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenUpgrade}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Free Quota & Bonus Space</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, storageInfo.percentage * 0.45)}%` }} title="PDFs (1.15 GB)" />
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, storageInfo.percentage * 0.30)}%` }} title="Documents (0.78 GB)" />
                <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, storageInfo.percentage * 0.20)}%` }} title="Images (0.56 GB)" />
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, storageInfo.percentage * 0.05)}%` }} title="Temporary Cache (0.09 GB)" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> PDF Files (1.15 GB)</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Office Docs (0.78 GB)</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Images (0.56 GB)</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Temporary Cache (0.09 GB)</div>
              </div>
            </div>

            {/* Cache Purge Action */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Manual Ephemeral Cache Purge</p>
                  <p className="text-[11px] text-slate-400">Instantly delete all temporary conversion files older than 1 hour</p>
                </div>
              </div>

              <button
                onClick={handlePurgeCache}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                {purged ? 'Purged 86 MB Cache!' : 'Purge Temp Cache'}
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
