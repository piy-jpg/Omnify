/**
 * Types & Interfaces for AI Watermark & Object Remover (AI Media Cleanup Engine)
 */

export type MediaType = 'image' | 'video';

export type DetectionType = 'watermark' | 'logo' | 'text' | 'object' | 'badge' | 'timestamp';

export interface BoundingBox {
  /** Normalized X coordinate (0.0 to 1.0) */
  x: number;
  /** Normalized Y coordinate (0.0 to 1.0) */
  y: number;
  /** Normalized width (0.0 to 1.0) */
  width: number;
  /** Normalized height (0.0 to 1.0) */
  height: number;
}

export interface TrajectoryPoint {
  time: number; // in seconds
  boundingBox: BoundingBox;
}

export interface MediaDetectionItem {
  id: string;
  type: DetectionType;
  label: string;
  confidence: number; // 0.0 to 1.0
  boundingBox: BoundingBox;
  isStatic?: boolean;
  selected?: boolean;
  trajectory?: TrajectoryPoint[];
}

export type MaskTool = 'brush' | 'rectangle' | 'lasso' | 'eraser';

export interface MaskBrushOptions {
  size: number; // in pixels (e.g. 10 to 120)
  softness: number; // 0 (hard edge) to 1 (feathered)
  mode: 'add' | 'erase';
}

export interface MediaMetadata {
  name: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  duration?: number; // in seconds for video
  fps?: number;
  hasAudio?: boolean;
}

export type JobStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'detecting'
  | 'processing'
  | 'encoding'
  | 'completed'
  | 'failed';

export interface QualityReport {
  resolutionPreserved: boolean;
  originalDimensions: string;
  outputDimensions: string;
  aspectRatioPreserved: boolean;
  durationPreserved?: boolean;
  originalDuration?: string;
  outputDuration?: string;
  fpsPreserved?: boolean;
  originalFps?: number;
  outputFps?: number;
  audioPreserved?: boolean;
  sizeChangeRatio?: string;
}

export interface WatermarkRemovalJob {
  id: string;
  mediaType: MediaType;
  status: JobStatus;
  progress: number; // 0 to 100
  stageMessage: string;
  originalUrl: string;
  outputUrl?: string;
  outputFileName?: string;
  detections: MediaDetectionItem[];
  qualityReport?: QualityReport;
  error?: string;
  createdAt: number;
  timeRange?: {
    startTime: number;
    endTime: number;
  };
}

export interface InpaintingOptions {
  radius?: number;
  method?: 'telea' | 'patchmatch' | 'hybrid';
  edgeFeathering?: number;
  preserveSurroundGradients?: boolean;
}
