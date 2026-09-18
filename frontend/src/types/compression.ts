/**
 * ConvertPro Smart File Compressor Types
 */

export type CompressionPreset = 'fast' | 'balanced' | 'high' | 'maximum' | 'target';

export type CompressionMode = 'fast' | 'balanced' | 'max' | 'high_quality' | 'target_size';

export type VideoResolution = 'original' | '1080p' | '720p' | '480p' | 'custom';

export type AudioMode = 'preserve' | 'reduced' | 'mute';

export type ImageResizeScale = 'original' | '75%' | '50%' | 'custom';

export interface FormatSpecificOptions {
  // Video
  resolution?: VideoResolution;
  audioMode?: AudioMode;
  // Image
  resizeScale?: ImageResizeScale;
  customWidth?: number;
  customHeight?: number;
}

export interface CompressionOptions {
  preset: CompressionPreset;
  quality: number; // 1 - 100
  targetSizeBytes?: number | null;
  targetSizeFormatted?: string;
  resolution?: VideoResolution;
  audioMode?: AudioMode;
  resizeScale?: ImageResizeScale;
  customWidth?: number;
  customHeight?: number;
}

export type QueueItemStatus =
  | 'waiting'
  | 'analyzing'
  | 'compressing'
  | 'validating'
  | 'complete'
  | 'failed';

export interface FileAnalysisDetails {
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  durationFormatted?: string;
  fps?: number;
  bitrate?: number;
  bitrateKbps?: number;
  codec?: string;
  audioCodec?: string;
  embeddedMediaCount?: number;
  totalMediaBytes?: number;
  mediaPercentage?: number;
  compressibleEntries?: number;
  alreadyCompressedEntries?: number;
  totalEntries?: number;
}

export interface SmartRecommendation {
  title: string;
  description: string;
  suggestedSetting?: Partial<CompressionOptions>;
}

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  format: string;
  category: 'document' | 'image' | 'video' | 'presentation' | 'archive' | 'general';
  mimeType: string;
  details?: FileAnalysisDetails;
  recommendations?: SmartRecommendation[];
}

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  format: string;
  category: 'document' | 'image' | 'video' | 'presentation' | 'archive' | 'general';
  originalSize: number;
  status: QueueItemStatus;
  progress: number;
  stageMessage?: string;
  options: CompressionOptions;
  analysis?: FileAnalysisResult;
  compressedSize?: number;
  savedBytes?: number;
  reductionPercentage?: number;
  becameLarger?: boolean;
  jobId?: string;
  downloadUrl?: string;
  resultBlob?: Blob;
  previewUrl?: string;
  compressedPreviewUrl?: string;
  error?: string;
  warning?: string;
}

export interface BatchSummary {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
  overallReductionPercentage: number;
}
