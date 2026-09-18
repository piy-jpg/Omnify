import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Presentation,
  ArrowRight,
  Sparkles,
  Download,
  CheckCircle2,
  RefreshCw,
  X,
  File,
  Zap,
  Table,
  FileCheck,
  Image as ImageIcon,
  FileBox,
  AlignLeft,
  FileSpreadsheet,
  Code,
  FileCode,
  Music,
  Video,
  Globe,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToolItem, FileItem } from '../types';
import { ConverterEngine } from '../services/converterEngine';
import { formatBytes } from '../utils/formatters';

interface FileStudioPageProps {
  onSelectTool?: (tool: ToolItem) => void;
  onFileConverted: (file: FileItem) => void;
  tools?: ToolItem[];
  onOpenAiDocCompare?: () => void;
  onOpenOcrExtract?: () => void;
  initialMode?: string;
  initialType?: string;
}

export interface OutputOption {
  id: string;
  label: string;
  ext: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

// Single Source of Truth Conversion Registry
export const CONVERSION_REGISTRY: Record<string, OutputOption[]> = {
  pdf: [
    { id: 'pdf-to-word', label: 'PDF → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
    { id: 'pdf-to-pptx', label: 'PDF → PowerPoint', ext: 'PPTX', desc: 'Editable presentation slides', icon: Presentation, color: 'orange' },
    { id: 'pdf-to-xlsx', label: 'PDF → Excel', ext: 'XLSX', desc: 'Extract data to spreadsheet', icon: Table, color: 'emerald' },
    { id: 'pdf-to-jpg', label: 'PDF → JPG', ext: 'JPG', desc: 'High-res page image', icon: ImageIcon, color: 'cyan' },
    { id: 'pdf-to-png', label: 'PDF → PNG', ext: 'PNG', desc: 'Lossless page image', icon: ImageIcon, color: 'blue' },
    { id: 'pdf-to-txt', label: 'PDF → Text', ext: 'TXT', desc: 'Extract plain text', icon: AlignLeft, color: 'slate' },
    { id: 'compress-pdf', label: 'Compress PDF', ext: 'PDF', desc: 'Reduce file size', icon: FileBox, color: 'purple' },
  ],
  txt: [
    { id: 'txt-to-pdf', label: 'TXT → PDF', ext: 'PDF', desc: 'Styled vector PDF', icon: FileCheck, color: 'slate' },
    { id: 'txt-to-docx', label: 'TXT → Word', ext: 'DOCX', desc: 'Formatted Word document', icon: FileText, color: 'blue' },
  ],
  docx: [
    { id: 'docx-to-pdf', label: 'Word → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileCheck, color: 'blue' },
    { id: 'docx-to-txt', label: 'Word → TXT', ext: 'TXT', desc: 'Extract plain text', icon: AlignLeft, color: 'slate' },
  ],
  doc: [
    { id: 'docx-to-pdf', label: 'Word → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileCheck, color: 'blue' },
  ],
  pptx: [
    { id: 'pptx-to-pdf', label: 'PPTX → PDF', ext: 'PDF', desc: 'Slide deck PDF', icon: FileCheck, color: 'orange' },
  ],
  ppt: [
    { id: 'pptx-to-pdf', label: 'PPT → PDF', ext: 'PDF', desc: 'Slide deck PDF', icon: FileCheck, color: 'orange' },
  ],
  xlsx: [
    { id: 'xlsx-to-pdf', label: 'Excel → PDF', ext: 'PDF', desc: 'Spreadsheet PDF', icon: FileCheck, color: 'emerald' },
    { id: 'xlsx-to-csv', label: 'Excel → CSV', ext: 'CSV', desc: 'Raw tabular data', icon: Table, color: 'blue' },
  ],
  xls: [
    { id: 'xlsx-to-pdf', label: 'Excel → PDF', ext: 'PDF', desc: 'Spreadsheet PDF', icon: FileCheck, color: 'emerald' },
    { id: 'xlsx-to-csv', label: 'Excel → CSV', ext: 'CSV', desc: 'Raw tabular data', icon: Table, color: 'blue' },
  ],
  csv: [
    { id: 'csv-to-json', label: 'CSV → JSON', ext: 'JSON', desc: 'Structured JSON objects', icon: Code, color: 'indigo' },
    { id: 'csv-to-xlsx', label: 'CSV → Excel', ext: 'XLSX', desc: 'Formatted spreadsheet', icon: FileSpreadsheet, color: 'emerald' },
    { id: 'csv-to-pdf', label: 'CSV → PDF', ext: 'PDF', desc: 'Printable grid layout', icon: FileCheck, color: 'rose' },
    { id: 'csv-to-html', label: 'CSV → HTML', ext: 'HTML', desc: 'Responsive web table', icon: Globe, color: 'blue' },
  ],
  json: [
    { id: 'json-to-csv', label: 'JSON → CSV', ext: 'CSV', desc: 'Tabular spreadsheet data', icon: Table, color: 'emerald' },
    { id: 'json-to-xlsx', label: 'JSON → Excel', ext: 'XLSX', desc: 'Formatted spreadsheet', icon: FileSpreadsheet, color: 'blue' },
    { id: 'json-to-yaml', label: 'JSON → YAML', ext: 'YAML', desc: 'Configuration syntax', icon: FileCode, color: 'amber' },
    { id: 'json-to-xml', label: 'JSON → XML', ext: 'XML', desc: 'Hierarchical XML tree', icon: Code, color: 'purple' },
    { id: 'json-to-pdf', label: 'JSON → PDF', ext: 'PDF', desc: 'Structured PDF document', icon: FileCheck, color: 'rose' },
  ],
  md: [
    { id: 'md-to-pdf', label: 'Markdown → PDF', ext: 'PDF', desc: 'Clean formatted document', icon: FileCheck, color: 'rose' },
    { id: 'md-to-html', label: 'Markdown → HTML', ext: 'HTML', desc: 'Styled responsive webpage', icon: Globe, color: 'indigo' },
    { id: 'md-to-docx', label: 'Markdown → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
  ],
  markdown: [
    { id: 'md-to-pdf', label: 'Markdown → PDF', ext: 'PDF', desc: 'Clean formatted document', icon: FileCheck, color: 'rose' },
    { id: 'md-to-html', label: 'Markdown → HTML', ext: 'HTML', desc: 'Styled responsive webpage', icon: Globe, color: 'indigo' },
    { id: 'md-to-docx', label: 'Markdown → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
  ],
  html: [
    { id: 'html-to-pdf', label: 'HTML → PDF', ext: 'PDF', desc: 'Printable vector document', icon: FileCheck, color: 'rose' },
    { id: 'html-to-markdown', label: 'HTML → Markdown', ext: 'MD', desc: 'Clean Markdown notes', icon: FileCode, color: 'indigo' },
    { id: 'html-to-docx', label: 'HTML → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
    { id: 'html-to-txt', label: 'HTML → Text', ext: 'TXT', desc: 'Extracted plain text', icon: AlignLeft, color: 'slate' },
  ],
  htm: [
    { id: 'html-to-pdf', label: 'HTML → PDF', ext: 'PDF', desc: 'Printable vector document', icon: FileCheck, color: 'rose' },
    { id: 'html-to-markdown', label: 'HTML → Markdown', ext: 'MD', desc: 'Clean Markdown notes', icon: FileCode, color: 'indigo' },
    { id: 'html-to-docx', label: 'HTML → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
  ],
  rtf: [
    { id: 'rtf-to-pdf', label: 'RTF → PDF', ext: 'PDF', desc: 'Styled vector PDF', icon: FileCheck, color: 'rose' },
    { id: 'rtf-to-docx', label: 'RTF → Word', ext: 'DOCX', desc: 'Editable Word document', icon: FileText, color: 'blue' },
    { id: 'rtf-to-txt', label: 'RTF → Text', ext: 'TXT', desc: 'Extract plain text', icon: AlignLeft, color: 'slate' },
  ],
  mp4: [
    { id: 'video-to-mp3', label: 'MP4 → MP3', ext: 'MP3', desc: 'Extract audio track', icon: Music, color: 'purple' },
    { id: 'video-to-wav', label: 'MP4 → WAV', ext: 'WAV', desc: 'Lossless audio extraction', icon: Music, color: 'indigo' },
  ],
  mov: [
    { id: 'video-to-mp3', label: 'MOV → MP3', ext: 'MP3', desc: 'Extract audio track', icon: Music, color: 'purple' },
    { id: 'video-to-wav', label: 'MOV → WAV', ext: 'WAV', desc: 'Lossless audio extraction', icon: Music, color: 'indigo' },
  ],
  webm: [
    { id: 'video-to-mp3', label: 'WebM → MP3', ext: 'MP3', desc: 'Extract audio track', icon: Music, color: 'purple' },
    { id: 'video-to-wav', label: 'WebM → WAV', ext: 'WAV', desc: 'Lossless audio extraction', icon: Music, color: 'indigo' },
  ],
  mp3: [
    { id: 'audio-to-wav', label: 'MP3 → WAV', ext: 'WAV', desc: 'Uncompressed PCM audio', icon: Music, color: 'indigo' },
  ],
  wav: [
    { id: 'audio-to-mp3', label: 'WAV → MP3', ext: 'MP3', desc: 'High quality audio stream', icon: Music, color: 'purple' },
  ],
  m4a: [
    { id: 'audio-to-mp3', label: 'M4A → MP3', ext: 'MP3', desc: 'Standard MP3 audio', icon: Music, color: 'purple' },
    { id: 'audio-to-wav', label: 'M4A → WAV', ext: 'WAV', desc: 'Lossless PCM audio', icon: Music, color: 'indigo' },
  ],
  ogg: [
    { id: 'audio-to-mp3', label: 'OGG → MP3', ext: 'MP3', desc: 'Standard MP3 audio', icon: Music, color: 'purple' },
    { id: 'audio-to-wav', label: 'OGG → WAV', ext: 'WAV', desc: 'Lossless PCM audio', icon: Music, color: 'indigo' },
  ],
  svg: [
    { id: 'svg-to-png', label: 'SVG → PNG', ext: 'PNG', desc: 'High-DPI raster image', icon: ImageIcon, color: 'blue' },
    { id: 'svg-to-jpg', label: 'SVG → JPG', ext: 'JPG', desc: 'Compressed JPEG image', icon: ImageIcon, color: 'cyan' },
    { id: 'svg-to-webp', label: 'SVG → WEBP', ext: 'WEBP', desc: 'Optimized web graphic', icon: ImageIcon, color: 'indigo' },
  ],
  jpg: [
    { id: 'jpg-to-png', label: 'JPG → PNG', ext: 'PNG', desc: 'Transparent support', icon: ImageIcon, color: 'blue' },
    { id: 'jpg-to-webp', label: 'JPG → WEBP', ext: 'WEBP', desc: 'Optimized web graphic', icon: ImageIcon, color: 'indigo' },
    { id: 'jpg-to-pdf', label: 'JPG → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileBox, color: 'rose' },
    { id: 'image-to-ico', label: 'JPG → Favicon ICO', ext: 'ICO', desc: 'Multi-res app icon', icon: Layers, color: 'amber' },
    { id: 'image-to-svg', label: 'JPG → SVG Vector', ext: 'SVG', desc: 'Scalable vector container', icon: Code, color: 'purple' },
    { id: 'image-to-docx', label: 'JPG → Word (OCR)', ext: 'DOCX', desc: 'Extract text to Word', icon: FileText, color: 'amber' },
  ],
  jpeg: [
    { id: 'jpg-to-png', label: 'JPG → PNG', ext: 'PNG', desc: 'Transparent support', icon: ImageIcon, color: 'blue' },
    { id: 'jpg-to-webp', label: 'JPG → WEBP', ext: 'WEBP', desc: 'Optimized web graphic', icon: ImageIcon, color: 'indigo' },
    { id: 'jpg-to-pdf', label: 'JPG → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileBox, color: 'rose' },
    { id: 'image-to-ico', label: 'JPG → Favicon ICO', ext: 'ICO', desc: 'Multi-res app icon', icon: Layers, color: 'amber' },
    { id: 'image-to-svg', label: 'JPG → SVG Vector', ext: 'SVG', desc: 'Scalable vector container', icon: Code, color: 'purple' },
    { id: 'image-to-docx', label: 'JPG → Word (OCR)', ext: 'DOCX', desc: 'Extract text to Word', icon: FileText, color: 'amber' },
  ],
  png: [
    { id: 'png-to-jpg', label: 'PNG → JPG', ext: 'JPG', desc: 'Lightweight format', icon: ImageIcon, color: 'rose' },
    { id: 'png-to-webp', label: 'PNG → WEBP', ext: 'WEBP', desc: 'Optimized web graphic', icon: ImageIcon, color: 'indigo' },
    { id: 'png-to-pdf', label: 'PNG → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileBox, color: 'rose' },
    { id: 'image-to-ico', label: 'PNG → Favicon ICO', ext: 'ICO', desc: 'Multi-res app icon', icon: Layers, color: 'amber' },
    { id: 'image-to-svg', label: 'PNG → SVG Vector', ext: 'SVG', desc: 'Scalable vector container', icon: Code, color: 'purple' },
    { id: 'image-to-docx', label: 'PNG → Word (OCR)', ext: 'DOCX', desc: 'Extract text to Word', icon: FileText, color: 'amber' },
  ],
  webp: [
    { id: 'webp-to-jpg', label: 'WEBP → JPG', ext: 'JPG', desc: 'Universal format', icon: ImageIcon, color: 'indigo' },
    { id: 'webp-to-png', label: 'WEBP → PNG', ext: 'PNG', desc: 'Lossless PNG', icon: ImageIcon, color: 'blue' },
    { id: 'webp-to-pdf', label: 'WEBP → PDF', ext: 'PDF', desc: 'Vector document PDF', icon: FileBox, color: 'rose' },
    { id: 'image-to-ico', label: 'WEBP → Favicon ICO', ext: 'ICO', desc: 'Multi-res app icon', icon: Layers, color: 'amber' },
  ],
  zip: [
    { id: 'zip-to-pdf', label: 'ZIP → PDF', ext: 'PDF', desc: 'Compile contents into PDF', icon: FileCheck, color: 'rose' },
    { id: 'extract-zip', label: 'Extract ZIP', ext: 'ZIP', desc: 'Unpack files & manifest', icon: FolderOpen, color: 'emerald' },
    { id: 'compress-zip', label: 'Optimize ZIP', ext: 'ZIP', desc: 'Maximum recompression', icon: FileBox, color: 'purple' },
  ]
};

// Detect format key from File
export function detectFormatKey(file: File): string {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() || '';
  if (ext && CONVERSION_REGISTRY[ext]) return ext;

  const mime = file.type.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'text/plain') return 'txt';
  if (mime === 'text/csv') return 'csv';
  if (mime === 'application/json') return 'json';
  if (mime === 'text/markdown') return 'md';
  if (mime === 'text/html') return 'html';
  if (mime === 'application/rtf') return 'rtf';
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') return 'zip';
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return 'docx';
  if (mime.includes('presentationml') || mime === 'application/vnd.ms-powerpoint') return 'pptx';
  if (mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel') return 'xlsx';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime.startsWith('video/mp4')) return 'mp4';
  if (mime.startsWith('video/quicktime')) return 'mov';
  if (mime.startsWith('video/webm')) return 'webm';
  if (mime.startsWith('audio/mpeg') || mime.startsWith('audio/mp3')) return 'mp3';
  if (mime.startsWith('audio/wav')) return 'wav';

  return ext || 'pdf';
}

export function getRelevantOutputs(file: File): OutputOption[] {
  const key = detectFormatKey(file);
  return CONVERSION_REGISTRY[key] || [
    { id: 'pdf-to-word', label: 'Convert Document', ext: 'DOCX', desc: 'Auto-detect format', icon: FileText, color: 'brand' }
  ];
}

function getFileTypeLabel(file: File): string {
  const key = detectFormatKey(file);
  const labels: Record<string, string> = {
    pdf: 'PDF Document',
    txt: 'Plain Text (TXT)',
    docx: 'Word Document (DOCX)',
    doc: 'Word Document (DOC)',
    pptx: 'PowerPoint Deck (PPTX)',
    ppt: 'PowerPoint Deck (PPT)',
    xlsx: 'Excel Spreadsheet (XLSX)',
    xls: 'Excel Spreadsheet (XLS)',
    csv: 'CSV Tabular Dataset',
    json: 'JSON Data Document',
    md: 'Markdown Document (MD)',
    markdown: 'Markdown Document',
    html: 'HTML Web Document',
    htm: 'HTML Document',
    rtf: 'Rich Text Format (RTF)',
    zip: 'ZIP Archive Package',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    webp: 'WEBP Image',
    svg: 'Scalable Vector Graphics (SVG)',
    mp4: 'MP4 Video',
    mov: 'QuickTime Video (MOV)',
    webm: 'WebM Video',
    mp3: 'MP3 Audio Stream',
    wav: 'PCM WAV Audio',
    m4a: 'M4A Audio',
    ogg: 'OGG Vorbis Audio'
  };
  return labels[key] || file.name.split('.').pop()?.toUpperCase() || 'File';
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; selectedBg: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'hover:border-blue-400', selectedBg: 'bg-blue-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'hover:border-orange-400', selectedBg: 'bg-orange-600' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-400', selectedBg: 'bg-emerald-600' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400', border: 'hover:border-cyan-400', selectedBg: 'bg-cyan-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'hover:border-purple-400', selectedBg: 'bg-purple-600' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'hover:border-rose-400', selectedBg: 'bg-rose-600' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'hover:border-indigo-400', selectedBg: 'bg-indigo-600' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'hover:border-amber-400', selectedBg: 'bg-amber-600' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'hover:border-slate-400', selectedBg: 'bg-slate-600' },
  brand: { bg: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400', border: 'hover:border-brand-400', selectedBg: 'bg-brand-600' },
};

export const FileStudioPage: React.FC<FileStudioPageProps> = ({
  onSelectTool,
  onFileConverted,
  tools,
  onOpenAiDocCompare,
  onOpenOcrExtract,
  initialMode,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [targetPreset, setTargetPreset] = useState<{ sourceFormat: string; targetFormat: string; toolId: string; accept: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('Processing conversion...');
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const relevantOutputs = uploadedFile ? getRelevantOutputs(uploadedFile) : [];

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setResult(null);
    const outputs = getRelevantOutputs(file);

    // If a preset was active and matches one of the outputs, keep it selected
    if (targetPreset) {
      const match = outputs.find(o => o.id === targetPreset.toolId);
      if (match) {
        setSelectedOutputId(match.id);
        return;
      }
    }

    // Default to first output
    if (outputs.length > 0) {
      setSelectedOutputId(outputs[0].id);
    } else {
      setSelectedOutputId(null);
    }
  }, [targetPreset]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handlePresetClick = (preset: { sourceFormat: string; targetFormat: string; toolId: string; accept: string }) => {
    setTargetPreset(preset);
    setSelectedOutputId(preset.toolId);
    setUploadedFile(null);
    setResult(null);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleConvert = async () => {
    if (!uploadedFile || !selectedOutputId) return;
    setIsProcessing(true);
    setProgressMsg('Reading file structure...');
    setResult(null);

    try {
      const res = await ConverterEngine.convertFile(
        uploadedFile,
        selectedOutputId,
        {},
        (p) => {
          if (p.message) setProgressMsg(p.message);
        }
      );
      setResult(res);
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });

      const output = relevantOutputs.find(o => o.id === selectedOutputId);
      const newFile: FileItem = {
        id: `studio-${Date.now()}`,
        name: res.downloadName,
        size: res.convertedSize,
        type: res.mimeType,
        extension: output?.ext || res.downloadName.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedAt: 'Just now',
        status: 'ready',
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        previewUrl: res.previewUrl,
      };
      onFileConverted(newFile);
    } catch (err) {
      alert('Conversion failed. Please try again.');
    } finally {
      setIsProcessing(false);
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
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Popular Quick Action Cards specified by user requirements
  const popularPresets = [
    { toolId: 'pdf-to-word', label: 'PDF → Word', from: 'PDF', to: 'DOCX', sourceFormat: 'PDF', targetFormat: 'DOCX', accept: '.pdf', color: 'blue' },
    { toolId: 'pdf-to-pptx', label: 'PDF → PPTX', from: 'PDF', to: 'PPTX', sourceFormat: 'PDF', targetFormat: 'PPTX', accept: '.pdf', color: 'orange' },
    { toolId: 'pdf-to-xlsx', label: 'PDF → Excel', from: 'PDF', to: 'XLSX', sourceFormat: 'PDF', targetFormat: 'XLSX', accept: '.pdf', color: 'emerald' },
    { toolId: 'jpg-to-pdf', label: 'JPG → PDF', from: 'JPG', to: 'PDF', sourceFormat: 'JPG', targetFormat: 'PDF', accept: '.jpg,.jpeg,.png,.webp', color: 'rose' },
    { toolId: 'txt-to-pdf', label: 'TXT → PDF', from: 'TXT', to: 'PDF', sourceFormat: 'TXT', targetFormat: 'PDF', accept: '.txt', color: 'slate' },
    { toolId: 'docx-to-pdf', label: 'DOCX → PDF', from: 'DOCX', to: 'PDF', sourceFormat: 'DOCX', targetFormat: 'PDF', accept: '.docx,.doc', color: 'blue' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/30">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15">
            <FolderOpen className="w-3.5 h-3.5 text-brand-300" />
            <span>Universal File Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your Complete Conversion Workspace
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-2xl">
            Upload any file — PDF, TXT, DOCX, PPTX, XLSX, JPG, PNG, WEBP, CSV, JSON, Markdown, HTML, RTF, Video, Audio, or SVG. We auto-detect the format and execute high-fidelity transformations with zero content loss.
          </p>

          {/* Format tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {['PDF', 'DOCX', 'PPTX', 'XLSX', 'CSV', 'JSON', 'MD', 'HTML', 'JPG', 'PNG', 'WEBP', 'MP4', 'MP3', 'SVG', 'ICO'].map(fmt => (
              <span key={fmt} className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold text-white/80">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* Upload Zone or File Info */}
        {!uploadedFile ? (
            <div className="space-y-4">
              {targetPreset && (
                <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-brand-800 dark:text-brand-300 font-bold">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Configured for: {targetPreset.sourceFormat} → {targetPreset.targetFormat}</span>
                  </div>
                  <button
                    onClick={() => setTargetPreset(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    Clear Preset
                  </button>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={targetPreset ? targetPreset.accept : '.pdf,.txt,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.json,.md,.markdown,.html,.htm,.rtf,.zip,.jpg,.jpeg,.png,.webp,.svg,.ico,.mp4,.mov,.webm,.mp3,.wav,.m4a,.ogg'}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors ${
                    isDragging
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                  }`}>
                    <Upload className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isDragging
                        ? 'Drop it here!'
                        : targetPreset
                        ? `Upload your ${targetPreset.sourceFormat} file`
                        : 'Drop your file here'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      or <span className="text-brand-600 dark:text-brand-400 font-semibold underline underline-offset-2">Browse files</span> from your device
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {['PDF', 'ZIP', 'DOCX', 'PPTX', 'XLSX', 'CSV', 'JSON', 'MD', 'HTML', 'JPG', 'PNG', 'WEBP', 'MP4', 'MP3', 'SVG'].map(fmt => (
                      <span key={fmt} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Detected File Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                      <File className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{uploadedFile.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                          {getFileTypeLabel(uploadedFile)}
                        </span>
                        <span className="text-xs text-slate-400">{formatBytes(uploadedFile.size)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setUploadedFile(null); setResult(null); setSelectedOutputId(null); setTargetPreset(null); }}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* What would you like to do? */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Select Target Conversion Format:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {relevantOutputs.map(output => {
                      const Icon = output.icon;
                      const colors = COLOR_MAP[output.color] || COLOR_MAP.brand;
                      const isSelected = selectedOutputId === output.id;

                      return (
                        <button
                          key={output.id}
                          onClick={() => { setSelectedOutputId(output.id); setResult(null); }}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? `${colors.selectedBg} text-white border-transparent shadow-md`
                              : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${colors.border} hover:shadow-sm`
                          }`}
                        >
                          <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-white/20' : `${colors.bg} ${colors.text}`
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {output.label}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                              {output.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-white ml-auto flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Convert Action */}
              {!result && selectedOutputId && (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold shadow-md hover:shadow-lg hover:shadow-brand-500/20 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{progressMsg}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>
                        Convert to {relevantOutputs.find(o => o.id === selectedOutputId)?.ext || 'Target Format'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {/* Result */}
              {result && (
                <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Conversion Successful!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {result.downloadName} · {formatBytes(result.convertedSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download {result.downloadName}
                    </button>
                    <button
                      onClick={() => { setUploadedFile(null); setResult(null); setSelectedOutputId(null); setTargetPreset(null); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                    >
                      Convert Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick access grid when no file is selected */}
          {!uploadedFile && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Popular Conversions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {popularPresets.map(preset => {
                  const colors = COLOR_MAP[preset.color] || COLOR_MAP.brand;
                  return (
                    <button
                      key={preset.toolId}
                      onClick={() => handlePresetClick(preset)}
                      className={`group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${colors.border} hover:shadow-md transition-all text-left`}
                    >
                      <div className={`text-[10px] font-black mb-1.5 flex items-center gap-1 ${colors.text}`}>
                        <span className="px-1.5 py-0.5 rounded bg-current/10">{preset.from}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="px-1.5 py-0.5 rounded bg-current/10">{preset.to}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {preset.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
