/**
 * ConvertPro Client File Analyzer & Format Detector
 */

import { FileAnalysisResult } from '../../types/compression';

export function getFileCategory(filename: string, mime: string = ''): 'document' | 'image' | 'video' | 'presentation' | 'archive' | 'general' {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }

  if (['mp4', 'mov', 'webm', 'avi', 'm4v', 'mkv'].includes(ext) || mime.startsWith('video/')) {
    return 'video';
  }

  if (['pdf', 'docx', 'doc', 'txt', 'rtf'].includes(ext) || mime.includes('pdf') || mime.includes('word')) {
    return 'document';
  }

  if (['pptx', 'ppt'].includes(ext) || mime.includes('presentation')) {
    return 'presentation';
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip')) {
    return 'archive';
  }

  return 'general';
}

export function detectFormatClient(file: File) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const category = getFileCategory(file.name, file.type);
  return {
    ext,
    category,
    format: ext.toUpperCase(),
    mimeType: file.type || 'application/octet-stream'
  };
}

/**
 * Perform client-side quick inspection (image dimensions / video duration / recommendations)
 */
export async function analyzeFileClient(file: File): Promise<FileAnalysisResult> {
  const { ext, category, format, mimeType } = detectFormatClient(file);
  const size = file.size;

  const result: FileAnalysisResult = {
    fileName: file.name,
    fileSize: size,
    format,
    category,
    mimeType,
    details: {},
    recommendations: []
  };

  // Image analysis via HTML Image element
  if (category === 'image') {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((res) => {
        const t = setTimeout(() => res(false), 2000);
        img.onload = () => { clearTimeout(t); res(true); };
        img.onerror = () => { clearTimeout(t); res(false); };
        img.src = url;
      });
      URL.revokeObjectURL(url);

      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        result.details = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          resolution: `${img.naturalWidth}x${img.naturalHeight}`
        };

        if (img.naturalWidth > 2500 || size > 3 * 1024 * 1024) {
          result.recommendations?.push({
            title: 'High Resolution Detected',
            description: `Dimensions are ${img.naturalWidth}x${img.naturalHeight}px (${(size / 1024 / 1024).toFixed(1)} MB). Balanced compression + 75% scale can reduce size by up to 75%.`,
            suggestedSetting: { preset: 'balanced', quality: 80, resizeScale: '75%' }
          });
        }
      }
    } catch {}
  } else if (category === 'video') {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      await new Promise((res) => {
        const t = setTimeout(() => res(false), 2500);
        video.onloadedmetadata = () => { clearTimeout(t); res(true); };
        video.onerror = () => { clearTimeout(t); res(false); };
        video.src = url;
      });
      URL.revokeObjectURL(url);

      const dur = video.duration || 0;
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      result.details = {
        width: w > 0 ? w : 1920,
        height: h > 0 ? h : 1080,
        resolution: w > 0 && h > 0 ? `${w}x${h}` : '1080p',
        duration: dur,
        durationFormatted: dur > 0 ? `${Math.floor(dur / 60)}m ${Math.round(dur % 60)}s` : 'Unknown'
      };

      if (w >= 1920 || h >= 1080) {
        result.recommendations?.push({
          title: 'HD / 4K Video Downscale',
          description: 'Downscaling to 720p with Balanced CRF reduces video size by ~60% while maintaining great mobile and desktop playback quality.',
          suggestedSetting: { preset: 'balanced', resolution: '720p', quality: 75 }
        });
      }
    } catch {}
  } else if (category === 'presentation' || (category === 'document' && ext === 'docx')) {
    if (size > 2 * 1024 * 1024) {
      result.recommendations?.push({
        title: 'Embedded Media Optimization',
        description: `This ${format} contains large embedded media assets. Re-compressing embedded pictures can significantly downsize the document.`,
        suggestedSetting: { preset: 'balanced', quality: 80 }
      });
    }
  } else if (category === 'document' && ext === 'pdf') {
    if (size > 2 * 1024 * 1024) {
      result.recommendations?.push({
        title: 'PDF Stream Compression',
        description: 'Optimizing internal object streams and embedded fonts will reduce PDF payload size without degrading text clarity.',
        suggestedSetting: { preset: 'balanced', quality: 80 }
      });
    }
  }

  // Also query backend /api/compress/analyze with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/compress/analyze', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analysis) {
        return {
          ...result,
          ...data.analysis,
          details: { ...result.details, ...data.analysis.details },
          recommendations: data.analysis.recommendations?.length
            ? data.analysis.recommendations
            : result.recommendations
        };
      }
    }
  } catch {}

  return result;
}
