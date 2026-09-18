export type ToolCategory = 
  | 'all'
  | 'image-converter'
  | 'document-converter'
  | 'pdf-tools'
  | 'ocr-extract'
  | 'ai-assistant'
  | 'image-tools'
  | 'generators';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  fromFormat: string;
  toFormat: string;
  popular?: boolean;
  isAi?: boolean;
  isNew?: boolean;
  iconName: string;
  accentColor: string; // e.g., 'blue', 'purple', 'emerald', 'amber', 'rose', 'indigo'
  acceptedMimeTypes?: string[];
  maxFiles?: number;
  optionsType?: 'pdf-options' | 'image-options' | 'compress-options' | 'ocr-options' | 'generator-options';
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  uploadedAt: string;
  previewUrl?: string;
  convertedUrl?: string;
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  originalSize?: number;
  convertedSize?: number;
  category?: string;
  isStarred?: boolean;
  pages?: number;
}

export interface ConversionOptions {
  pageSize?: 'a4' | 'letter' | 'legal' | 'fit';
  orientation?: 'portrait' | 'landscape';
  imageQuality?: 'low' | 'medium' | 'high' | 'maximum';
  margins?: 'none' | 'small' | 'normal' | 'large';
  compressionLevel?: 'low' | 'recommended' | 'extreme';
  ocrLanguage?: 'eng' | 'spa' | 'fra' | 'deu' | 'hin' | 'auto';
  ocrOutputFormat?: 'txt' | 'docx' | 'pdf' | 'json';
  watermarkText?: string;
  password?: string;
  rotateDegrees?: 0 | 90 | 180 | 270;
  maintainAspectRatio?: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

export interface ConversionProgress {
  stage: 'idle' | 'uploading' | 'analyzing' | 'converting' | 'optimizing' | 'completed' | 'error';
  percent: number;
  message: string;
  detail?: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
  suggestedActions?: string[];
  extractedData?: {
    type: 'table' | 'bullets' | 'quiz' | 'summary';
    data: any;
  };
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'conversion' | 'system' | 'security' | 'feature';
  read: boolean;
  actionUrl?: string;
}

export interface StorageInfo {
  usedBytes: number;
  totalBytes: number;
  usedFormatted: string;
  totalFormatted: string;
  percentage: number;
  filesCount: number;
  byCategory: {
    pdf: number;
    documents: number;
    images: number;
    other: number;
  };
}
