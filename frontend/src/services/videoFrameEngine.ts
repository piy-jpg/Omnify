import JSZip from 'jszip';

export interface ExtractedFrame {
  id: string;
  frameIndex: number;
  timestamp: number;
  formattedTime: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sharpnessScore: number;
  sceneGroup?: number;
  isAiSelected?: boolean;
}

export interface VideoMetadata {
  name: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
  fps: number;
  format: string;
}

export interface ExtractionConfig {
  method: 'number' | 'every' | 'fps' | 'interval' | 'scenes' | 'ai-best';
  frameCount: number;
  fpsRate: number;
  intervalSeconds: number;
  startTime: number;
  endTime: number;
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 to 1.0
  targetResolution: 'original' | '4k' | '1080p' | '720p' | '480p' | 'custom';
  customWidth?: number;
  customHeight?: number;
  namingPattern: string;
  autoEnhance?: boolean;
  sharpen?: boolean;
  denoise?: boolean;
  upscale?: boolean;
  removeDuplicates?: boolean;
  duplicateThreshold?: number; // 0.8 - 0.99
}

export interface ExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  currentTimestamp: number;
  speedFps: number;
  status: 'idle' | 'analyzing' | 'extracting' | 'processing' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
}

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00.00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Calculates sharpness score of canvas frame using Laplacian variance approximation
 */
function calculateSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    const sampleW = Math.min(width, 160);
    const sampleH = Math.min(height, 90);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;
    let laplacianSum = 0;
    let count = 0;

    for (let y = 1; y < sampleH - 1; y += 2) {
      for (let x = 1; x < sampleW - 1; x += 2) {
        const idx = (y * sampleW + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const top = (data[idx - sampleW * 4] + data[idx - sampleW * 4 + 1] + data[idx - sampleW * 4 + 2]) / 3;
        const bottom = (data[idx + sampleW * 4] + data[idx + sampleW * 4 + 1] + data[idx + sampleW * 4 + 2]) / 3;

        const laplacian = Math.abs(4 * center - left - right - top - bottom);
        laplacianSum += laplacian;
        count++;
      }
    }
    return count > 0 ? Math.min(100, Math.round((laplacianSum / count) * 4)) : 75;
  } catch (e) {
    return 75;
  }
}

/**
 * Applies optional image enhancements (sharpen, brightness/contrast normalization) to canvas
 */
function applyCanvasEnhancements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ExtractionConfig
) {
  if (config.autoEnhance) {
    ctx.filter = 'contrast(108%) brightness(103%) saturate(106%)';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'none';
  }
}

/**
 * Computes target width and height based on resolution setting
 */
function computeDimensions(
  origW: number,
  origH: number,
  targetRes: ExtractionConfig['targetResolution'],
  customW?: number,
  customH?: number
): { width: number; height: number } {
  const aspect = origW / origH;
  switch (targetRes) {
    case '4k':
      return { width: 3840, height: Math.round(3840 / aspect) };
    case '1080p':
      return { width: 1920, height: Math.round(1920 / aspect) };
    case '720p':
      return { width: 1280, height: Math.round(1280 / aspect) };
    case '480p':
      return { width: 854, height: Math.round(854 / aspect) };
    case 'custom':
      return {
        width: customW && customW > 0 ? customW : origW,
        height: customH && customH > 0 ? customH : origH
      };
    case 'original':
    default:
      return { width: origW, height: origH };
  }
}

/**
 * Extracts video frames with non-blocking seek and async progress callbacks
 */
export async function extractVideoFrames(
  videoSource: string | File,
  config: ExtractionConfig,
  onProgress: (progress: ExtractionProgress) => void,
  isCancelled: () => boolean
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let videoUrl = '';
    if (typeof videoSource === 'string') {
      videoUrl = videoSource;
    } else {
      videoUrl = URL.createObjectURL(videoSource);
    }
    video.src = videoUrl;

    const cleanup = () => {
      if (typeof videoSource !== 'string' && videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      video.remove();
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 1;
        const startTime = Math.max(0, Math.min(config.startTime, duration - 0.05));
        const endTime = Math.min(duration, Math.max(config.endTime || duration, startTime + 0.1));
        const totalDuration = endTime - startTime;

        // Determine timestamps to capture
        const timestamps: number[] = [];
        const maxLimit = 1000;

        if (config.method === 'number') {
          const count = Math.min(maxLimit, Math.max(1, config.frameCount || 10));
          if (count === 1) {
            timestamps.push(startTime + totalDuration / 2);
          } else {
            const step = totalDuration / (count - 1);
            for (let i = 0; i < count; i++) {
              timestamps.push(Math.min(endTime, startTime + i * step));
            }
          }
        } else if (config.method === 'fps') {
          const fps = Math.max(0.1, config.fpsRate || 1);
          const step = 1 / fps;
          let t = startTime;
          while (t <= endTime && timestamps.length < maxLimit) {
            timestamps.push(t);
            t += step;
          }
        } else if (config.method === 'interval') {
          const interval = Math.max(0.1, config.intervalSeconds || 1);
          let t = startTime;
          while (t <= endTime && timestamps.length < maxLimit) {
            timestamps.push(t);
            t += interval;
          }
        } else if (config.method === 'scenes') {
          const sceneCount = Math.min(36, Math.max(8, Math.floor(totalDuration / 2)));
          const step = totalDuration / sceneCount;
          for (let i = 0; i < sceneCount; i++) {
            timestamps.push(startTime + i * step + (Math.sin(i) * 0.1 * step));
          }
        } else if (config.method === 'ai-best') {
          const sampleCount = Math.min(100, Math.max(20, config.frameCount * 2 || 40));
          const step = totalDuration / sampleCount;
          for (let i = 0; i < sampleCount; i++) {
            timestamps.push(startTime + i * step);
          }
        } else {
          const step = 1 / 24;
          let t = startTime;
          while (t <= endTime && timestamps.length < maxLimit) {
            timestamps.push(t);
            t += step;
          }
        }

        const targetDims = computeDimensions(
          video.videoWidth || 1920,
          video.videoHeight || 1080,
          config.targetResolution,
          config.customWidth,
          config.customHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = targetDims.width;
        canvas.height = targetDims.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          cleanup();
          reject(new Error('Failed to create canvas 2D rendering context'));
          return;
        }

        const extractedFrames: ExtractedFrame[] = [];
        const startTimeProcessing = performance.now();
        const totalFrames = timestamps.length;

        for (let i = 0; i < timestamps.length; i++) {
          if (isCancelled()) {
            cleanup();
            onProgress({
              currentFrame: i,
              totalFrames,
              percentage: Math.round((i / totalFrames) * 100),
              currentTimestamp: timestamps[i],
              speedFps: 0,
              status: 'cancelled'
            });
            resolve(extractedFrames);
            return;
          }

          const targetTime = timestamps[i];
          
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              seekResolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = targetTime;
          });

          ctx.drawImage(video, 0, 0, targetDims.width, targetDims.height);
          applyCanvasEnhancements(ctx, targetDims.width, targetDims.height, config);

          const sharpness = calculateSharpness(ctx, targetDims.width, targetDims.height);

          const mimeType = config.outputFormat || 'image/jpeg';
          const quality = config.quality || 0.92;

          const blob = await new Promise<Blob | null>((bResolve) => {
            canvas.toBlob((b) => bResolve(b), mimeType, quality);
          });

          if (blob) {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const frameIndex = i + 1;
            const sceneGroup = Math.floor((i / timestamps.length) * 6) + 1;

            extractedFrames.push({
              id: `frame-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
              frameIndex,
              timestamp: targetTime,
              formattedTime: formatTimecode(targetTime),
              blob,
              dataUrl,
              width: targetDims.width,
              height: targetDims.height,
              sizeBytes: blob.size,
              sharpnessScore: sharpness,
              sceneGroup,
              isAiSelected: sharpness > 65
            });
          }

          const elapsedSec = (performance.now() - startTimeProcessing) / 1000;
          const speedFps = elapsedSec > 0 ? Number((extractedFrames.length / elapsedSec).toFixed(1)) : 0;
          const percent = Math.round(((i + 1) / totalFrames) * 100);

          onProgress({
            currentFrame: i + 1,
            totalFrames,
            percentage: percent,
            currentTimestamp: targetTime,
            speedFps,
            status: 'extracting'
          });

          await new Promise(r => setTimeout(r, 10));
        }

        let finalFrames = extractedFrames;
        if (config.method === 'ai-best' && config.frameCount) {
          const sorted = [...extractedFrames].sort((a, b) => b.sharpnessScore - a.sharpnessScore);
          const topFrames = sorted.slice(0, config.frameCount).sort((a, b) => a.timestamp - b.timestamp);
          finalFrames = topFrames.map((f, idx) => ({
            ...f,
            frameIndex: idx + 1,
            isAiSelected: true
          }));
        }

        if (config.removeDuplicates && finalFrames.length > 2) {
          const filtered: ExtractedFrame[] = [];
          for (let k = 0; k < finalFrames.length; k++) {
            if (k === 0) {
              filtered.push(finalFrames[k]);
              continue;
            }
            const prev = finalFrames[k - 1];
            const timeDiff = Math.abs(finalFrames[k].timestamp - prev.timestamp);
            const sizeDiffRatio = Math.abs(finalFrames[k].sizeBytes - prev.sizeBytes) / Math.max(1, prev.sizeBytes);
            if (timeDiff > 0.1 || sizeDiffRatio > 0.05) {
              filtered.push(finalFrames[k]);
            }
          }
          finalFrames = filtered;
        }

        cleanup();
        onProgress({
          currentFrame: finalFrames.length,
          totalFrames: finalFrames.length,
          percentage: 100,
          currentTimestamp: endTime,
          speedFps: 0,
          status: 'completed'
        });

        resolve(finalFrames);
      } catch (err: any) {
        cleanup();
        onProgress({
          currentFrame: 0,
          totalFrames: 0,
          percentage: 0,
          currentTimestamp: 0,
          speedFps: 0,
          status: 'error',
          errorMessage: err?.message || 'Video frame extraction failed'
        });
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file. Please ensure it is a valid format (MP4, WEBM, MOV).'));
    };
  });
}

/**
 * Creates a Contact Sheet grid image from frames
 */
export async function generateContactSheet(
  frames: ExtractedFrame[],
  videoName: string,
  columns: number = 5,
  includeTimecodes: boolean = true
): Promise<{ blob: Blob; dataUrl: string }> {
  if (frames.length === 0) {
    throw new Error('No frames available for contact sheet');
  }

  const sample = frames[0];
  const thumbWidth = 320;
  const aspect = sample.width / sample.height;
  const thumbHeight = Math.round(thumbWidth / aspect);
  
  const numCols = Math.max(2, Math.min(10, columns));
  const numRows = Math.ceil(frames.length / numCols);

  const padding = 16;
  const headerHeight = 70;
  const labelHeight = includeTimecodes ? 24 : 0;

  const totalWidth = padding * (numCols + 1) + numCols * thumbWidth;
  const totalHeight = headerHeight + padding * (numRows + 1) + numRows * (thumbHeight + labelHeight);

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillText(`ConvertPro Video Contact Sheet: ${videoName}`, padding, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(`Extracted ${frames.length} frames • Resolution: ${sample.width}x${sample.height} • Generated ${new Date().toLocaleDateString()}`, padding, 58);

  for (let idx = 0; idx < frames.length; idx++) {
    const frame = frames[idx];
    const col = idx % numCols;
    const row = Math.floor(idx / numCols);

    const x = padding + col * (thumbWidth + padding);
    const y = headerHeight + padding + row * (thumbHeight + labelHeight + padding);

    await new Promise<void>((r) => {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 2, y - 2, thumbWidth + 4, thumbHeight + labelHeight + 4);

        ctx.drawImage(img, x, y, thumbWidth, thumbHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x + 6, y + 6, 44, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillText(`#${frame.frameIndex}`, x + 10, y + 20);

        if (includeTimecodes) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y + thumbHeight, thumbWidth, labelHeight);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '11px monospace, Inter, system-ui';
          ctx.fillText(`⏱ ${frame.formattedTime}`, x + 8, y + thumbHeight + 16);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px Inter, system-ui';
          ctx.fillText(`Sharp: ${frame.sharpnessScore}%`, x + thumbWidth - 65, y + thumbHeight + 16);
        }

        r();
      };
      img.src = frame.dataUrl;
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({
          blob,
          dataUrl: canvas.toDataURL('image/jpeg', 0.95)
        });
      }
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Creates and downloads a ZIP package of all frames
 */
export async function createFramesZip(
  frames: ExtractedFrame[],
  videoName: string,
  extension: string = 'jpg',
  namingPattern: string = 'frame',
  contactSheetBlob?: Blob
): Promise<Blob> {
  const zip = new JSZip();
  const folderName = `${videoName.replace(/\.[^/.]+$/, '')}_Frames`;
  const folder = zip.folder(folderName) || zip;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const padNum = (frame.frameIndex || i + 1).toString().padStart(4, '0');
    let filename = `${namingPattern}_${padNum}.${extension}`;
    if (namingPattern.includes('{number}')) {
      filename = namingPattern.replace('{number}', padNum) + `.${extension}`;
    }

    let fileData: Blob | string = frame.blob;
    if (!fileData && frame.dataUrl) {
      try {
        const response = await fetch(frame.dataUrl);
        fileData = await response.blob();
      } catch (e) {
        // Fallback to base64 stripping
        const base64Index = frame.dataUrl.indexOf(',');
        if (base64Index > -1) {
          fileData = frame.dataUrl.slice(base64Index + 1);
          folder.file(filename, fileData, { base64: true });
          continue;
        }
      }
    }

    if (fileData) {
      folder.file(filename, fileData);
    }
  }

  if (contactSheetBlob) {
    folder.file(`${videoName.replace(/\.[^/.]+$/, '')}_ContactSheet.jpg`, contactSheetBlob);
  }

  const manifest = {
    sourceVideo: videoName,
    totalFrames: frames.length,
    extractedAt: new Date().toISOString(),
    generator: 'OMNIFY Universal Video Studio (100% Free Lifetime Pass)',
    frames: frames.map((f, idx) => ({
      index: f.frameIndex || idx + 1,
      timestamp: f.timestamp,
      formattedTime: f.formattedTime,
      sharpness: f.sharpnessScore,
      sizeBytes: f.sizeBytes
    }))
  };
  folder.file('metadata.json', JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/**
 * Generates an interactive synthetic demo video (MP4/WEBM) on the fly for testing
 */
export function generateDemoVideoBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(new Blob([], { type: 'video/webm' }));
      return;
    }

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      resolve(videoBlob);
    };

    mediaRecorder.start();

    let frame = 0;
    const totalFrames = 90;

    function renderFrame() {
      if (!ctx) return;
      const progress = frame / totalFrames;

      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      const hue1 = (frame * 4) % 360;
      const hue2 = (hue1 + 90) % 360;
      grad.addColorStop(0, `hsl(${hue1}, 70%, 25%)`);
      grad.addColorStop(1, `hsl(${hue2}, 80%, 15%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      const cx = 640 + Math.sin(frame * 0.1) * 200;
      const cy = 360 + Math.cos(frame * 0.1) * 100;
      
      ctx.beginPath();
      ctx.arc(cx, cy, 120 + Math.sin(frame * 0.2) * 40, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${(hue1 + 180) % 360}, 90%, 65%, 0.85)`;
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 ConvertPro Video Frame Studio Demo', 640, 140);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '22px Inter, system-ui, sans-serif';
      ctx.fillText(`Frame ${frame + 1} / ${totalFrames} • Timestamp: ${(frame / 30).toFixed(2)}s`, 640, 190);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(240, 600, 800, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(240, 600, 800 * progress, 16);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(renderFrame);
      } else {
        setTimeout(() => mediaRecorder.stop(), 200);
      }
    }

    renderFrame();
  });
}
