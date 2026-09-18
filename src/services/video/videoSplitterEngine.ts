/**
 * ConvertPro Video Splitter Engine (Client-Side Interface)
 * Communicates with backend FFmpeg splitting worker, manages polling,
 * handles client-side calculations, demo mode simulation, and downloads.
 */

export interface VideoSplitConfig {
  splitMethod: 'parts' | 'duration';
  requestedParts: number; // 2 - 2000
  splitDurationValue: number;
  splitDurationUnit: 'seconds' | 'minutes' | 'hours';
  outputFormat: 'mp4' | 'mov' | 'webm';
  quality: 'source' | 'high' | 'medium' | 'custom';
  audioOption: 'keep' | 'remove';
  mode: 'stream_copy' | 'reencode';
}

export interface GeneratedPart {
  partId: string;
  partNumber: number;
  fileName: string;
  startTime: number;
  endTime: number;
  duration: number;
  formattedStart: string;
  formattedEnd: string;
  formattedDuration: string;
  fileSize: number;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl: string;
  previewUrl: string;
}

export interface SplitJobState {
  jobId: string;
  originalFileName: string;
  originalFileSize: number;
  duration: number;
  resolution: string;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  totalParts: number;
  splitMethod: 'parts' | 'duration';
  splitDuration: number;
  outputFormat: string;
  status: 'uploading' | 'analyzing' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentPart: number;
  stageMessage: string;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  parts: GeneratedPart[];
}

/**
 * Format seconds into HH:MM:SS
 */
export function formatSecondsToTimecode(sec: number): string {
  const s = Math.max(0, Number(sec) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format seconds into detailed time string (e.g. 1m 21s)
 */
export function formatDurationHuman(sec: number): string {
  const s = Math.round(Math.max(0, sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Calculate estimated parts & duration
 */
export function calculateSplitEstimates(
  totalDuration: number,
  config: VideoSplitConfig
): {
  estimatedParts: number;
  durationPerPartSec: number;
  formattedDurationPerPart: string;
  isValid: boolean;
  validationError?: string;
} {
  const dur = Math.max(0.1, totalDuration || 10);

  if (config.splitMethod === 'parts') {
    const parts = Math.floor(config.requestedParts);
    if (isNaN(parts) || parts < 2) {
      return {
        estimatedParts: 2,
        durationPerPartSec: dur / 2,
        formattedDurationPerPart: formatDurationHuman(dur / 2),
        isValid: false,
        validationError: 'Minimum 2 parts required.'
      };
    }
    if (parts > 2000) {
      return {
        estimatedParts: 2000,
        durationPerPartSec: dur / 2000,
        formattedDurationPerPart: formatDurationHuman(dur / 2000),
        isValid: false,
        validationError: 'Maximum supported parts is 2,000.'
      };
    }
    const partDur = dur / parts;
    return {
      estimatedParts: parts,
      durationPerPartSec: partDur,
      formattedDurationPerPart: formatDurationHuman(partDur),
      isValid: true
    };
  } else {
    let multiplier = 1;
    if (config.splitDurationUnit === 'minutes') multiplier = 60;
    if (config.splitDurationUnit === 'hours') multiplier = 3600;

    const splitSec = Math.max(0.1, config.splitDurationValue * multiplier);
    const count = Math.min(2000, Math.max(2, Math.ceil(dur / splitSec)));

    return {
      estimatedParts: count,
      durationPerPartSec: Math.min(dur, splitSec),
      formattedDurationPerPart: formatDurationHuman(Math.min(dur, splitSec)),
      isValid: true
    };
  }
}

/**
 * Convert split duration to seconds
 */
export function getSplitDurationInSeconds(config: VideoSplitConfig): number {
  let multiplier = 1;
  if (config.splitDurationUnit === 'minutes') multiplier = 60;
  if (config.splitDurationUnit === 'hours') multiplier = 3600;
  return Math.max(0.1, config.splitDurationValue * multiplier);
}

/**
 * Start Video Split Job via Backend API
 */
export async function startVideoSplit(
  file: File,
  config: VideoSplitConfig,
  onUploadProgress?: (percent: number) => void
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('splitMethod', config.splitMethod);
  formData.append('requestedParts', String(config.requestedParts));
  formData.append('splitDuration', String(getSplitDurationInSeconds(config)));
  formData.append('outputFormat', config.outputFormat);
  formData.append('quality', config.quality);
  formData.append('audioOption', config.audioOption);
  formData.append('mode', config.mode);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/video/split');

    if (xhr.upload && onUploadProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } else {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Server responded with status ${xhr.status}`));
        }
      } catch (err) {
        reject(new Error('Invalid response from server.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred while uploading video for splitting.'));
    };

    xhr.send(formData);
  });
}

/**
 * Poll Split Job status
 */
export async function pollSplitJob(jobId: string): Promise<SplitJobState> {
  const res = await fetch(`/api/video/split/job/${jobId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch split job status (${res.status})`);
  }
  const data = await res.json();
  return data.job;
}

/**
 * Trigger download of a single video part
 */
export function downloadSplitPart(downloadUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Trigger download of all generated parts as a server-side ZIP
 */
export function downloadSplitZip(jobId: string) {
  const a = document.createElement('a');
  a.href = `/api/video/split/download-zip/${jobId}`;
  a.download = `ConvertPro_Video_Split_${jobId}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
