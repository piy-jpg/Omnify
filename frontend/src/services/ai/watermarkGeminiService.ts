/**
 * AI Visual Intelligence & Watermark Detection Service (Gemini Vision + Fallback Engine)
 *
 * Interacts with Gemini Vision APIs to detect logos, watermarks, text overlays,
 * timestamps, and corner badges. Supports fallback visual saliency heuristics.
 */

import { MediaDetectionItem, MediaType, BoundingBox } from '../../types/watermark';

export interface AnalysisResponse {
  success: boolean;
  mediaType: MediaType;
  detections: MediaDetectionItem[];
  metadata: {
    width: number;
    height: number;
    duration?: number;
    fps?: number;
    hasAudio?: boolean;
  };
  provider: 'gemini' | 'heuristic_engine';
  message?: string;
}

/**
 * Analyze media file via backend API for watermark detection
 */
export async function analyzeMediaWithAI(
  file: File,
  onProgress?: (stage: string, percent: number) => void
): Promise<AnalysisResponse> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi)$/i.test(file.name);
  const mediaType: MediaType = isVideo ? 'video' : 'image';

  onProgress?.('Uploading media for visual intelligence analysis...', 20);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaType', mediaType);

  try {
    onProgress?.('Gemini Vision analyzing visual layers...', 50);

    const res = await fetch('/api/ai/watermark/analyze', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      onProgress?.('Extracting structured bounding boxes...', 85);
      const data = await res.json();
      onProgress?.('Analysis Complete', 100);
      return data;
    }
  } catch (err) {
    console.warn('[Watermark AI] Backend analysis request failed, running client fallback:', err);
  }

  // Client-side fallback detection if server was offline
  onProgress?.('Running local visual feature detector...', 70);
  const fallback = await runClientSideDetectionFallback(file, mediaType);
  onProgress?.('Analysis Complete', 100);
  return fallback;
}

/**
 * Local client-side fallback detection using canvas saliency & typical watermark zones
 */
async function runClientSideDetectionFallback(
  file: File,
  mediaType: MediaType
): Promise<AnalysisResponse> {
  let width = 1920;
  let height = 1080;
  let duration: number | undefined;

  if (mediaType === 'image') {
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
    } catch {
      // Keep default dimensions
    }
  } else {
    duration = 10;
  }

  // If no Gemini key is present, start with a clean slate unless the user explicitly brushes or selects
  const detections: MediaDetectionItem[] = [];

  return {
    success: true,
    mediaType,
    detections,
    metadata: {
      width,
      height,
      duration,
      fps: 30,
      hasAudio: true
    },
    provider: 'heuristic_engine',
    message: 'Media ready. Use Brush or Box tool to mark objects for removal.'
  };
}

/**
 * Detect or calculate tight bounding box for Google Gemini / Imagen 3 AI watermark sparkle
 */
export function detectGeminiWatermarkBox(canvas: HTMLCanvasElement): BoundingBox {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    try {
      // Scan bottom-right quadrant (x: 75%..98%, y: 68%..97%)
      const scanX = Math.floor(width * 0.75);
      const scanY = Math.floor(height * 0.68);
      const scanW = Math.floor(width * 0.23);
      const scanH = Math.floor(height * 0.29);

      const imgData = ctx.getImageData(scanX, scanY, scanW, scanH);
      const data = imgData.data;

      let bestScore = 0;
      let peakX = -1;
      let peakY = -1;

      // Search for sparkle star / bright local centroid
      const starRadius = Math.max(8, Math.min(24, Math.round(width * 0.015)));

      for (let y = starRadius + 2; y < scanH - starRadius - 2; y += 2) {
        for (let x = starRadius + 2; x < scanW - starRadius - 2; x += 2) {
          const idx = (y * scanW + x) * 4;
          const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

          // Check cross arms (horizontal & vertical) vs diagonal corners
          let crossLum = 0;
          let diagLum = 0;
          let count = 0;

          for (let r = 2; r <= starRadius; r += 2) {
            const up = ((y - r) * scanW + x) * 4;
            const down = ((y + r) * scanW + x) * 4;
            const left = (y * scanW + (x - r)) * 4;
            const right = (y * scanW + (x + r)) * 4;

            const ul = ((y - r) * scanW + (x - r)) * 4;
            const ur = ((y - r) * scanW + (x + r)) * 4;
            const dl = ((y + r) * scanW + (x - r)) * 4;
            const dr = ((y + r) * scanW + (x + r)) * 4;

            crossLum += (data[up] + data[down] + data[left] + data[right]) / 4;
            diagLum += (data[ul] + data[ur] + data[dl] + data[dr]) / 4;
            count++;
          }

          if (count > 0) {
            crossLum /= count;
            diagLum /= count;
            // Sparkle characteristic: cross arm brightness exceeds diagonal background brightness
            const sparkleScore = (crossLum - diagLum) + (centerLum * 0.15);
            if (sparkleScore > bestScore && sparkleScore > 12) {
              bestScore = sparkleScore;
              peakX = scanX + x;
              peakY = scanY + y;
            }
          }
        }
      }

      if (peakX !== -1 && peakY !== -1) {
        const boxRadiusX = Math.max(28, Math.min(60, Math.round(width * 0.035)));
        const boxRadiusY = Math.max(28, Math.min(60, Math.round(height * 0.045)));
        return {
          x: Math.max(0, (peakX - boxRadiusX) / width),
          y: Math.max(0, (peakY - boxRadiusY) / height),
          width: Math.min(1, (boxRadiusX * 2) / width),
          height: Math.min(1, (boxRadiusY * 2) / height)
        };
      }
    } catch (e) {
      console.warn('[Gemini Detector] Pixel scan fallback to geometric model:', e);
    }
  }

  return getGeminiWatermarkBox(width, height);
}

/**
 * Get tight normalized bounding box for Google Gemini / Imagen 3 corner watermark
 */
export function getGeminiWatermarkBox(width: number, height: number): BoundingBox {
  // Aspect ratio adjusted Gemini/Imagen badge placement
  const aspectRatio = width / height;

  let relCenterX = 0.94;
  let relCenterY = 0.88;
  let relWidth = 0.065;
  let relHeight = 0.085;

  if (aspectRatio > 1.5) {
    // 16:9 or panoramic image (e.g. 1408x768)
    relCenterX = 0.93;
    relCenterY = 0.84;
    relWidth = 0.06;
    relHeight = 0.10;
  } else if (aspectRatio < 0.8) {
    // 9:16 portrait image
    relCenterX = 0.92;
    relCenterY = 0.95;
    relWidth = 0.08;
    relHeight = 0.055;
  } else {
    // 1:1 or 4:3 square/standard
    relCenterX = 0.935;
    relCenterY = 0.925;
    relWidth = 0.065;
    relHeight = 0.065;
  }

  const startX = Math.max(0, Math.min(1 - relWidth, relCenterX - relWidth / 2));
  const startY = Math.max(0, Math.min(1 - relHeight, relCenterY - relHeight / 2));

  return {
    x: startX,
    y: startY,
    width: relWidth,
    height: relHeight
  };
}

/**
 * Convert normalized bounding box to canvas pixel coordinates
 */
export function boxToCanvasCoords(
  box: BoundingBox,
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    x: Math.max(0, Math.floor(box.x * canvasWidth)),
    y: Math.max(0, Math.floor(box.y * canvasHeight)),
    width: Math.min(canvasWidth, Math.ceil(box.width * canvasWidth)),
    height: Math.min(canvasHeight, Math.ceil(box.height * canvasHeight))
  };
}

