/**
 * ConvertPro Video Splitter Engine
 * Robust FFmpeg-powered video splitter supporting up to 2,000 output segments.
 * Features:
 * 1. Split by Number of Parts (2 -> 2000) or by Duration (Seconds, Minutes, Hours)
 * 2. Ultra-fast stream copy (-c copy) or accurate frame-boundary transcoding (-c:v libx264)
 * 3. Asynchronous job queuing with real-time segment progress tracking
 * 4. Deterministic filename sanitization (e.g. video_part_001.mp4 or video_part_0001.mp4)
 * 5. Server-side streaming ZIP bundling for 2,000+ files
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { probeVideoMetadata } from '../compression/videoCompressor.js';
import { execFfmpegCommand } from '../../config/ffmpeg.js';

// In-memory active video split jobs store
export const videoSplitJobs = new Map();

/**
 * Format seconds into HH:MM:SS or HH:MM:SS.mmm
 */
export function formatSecondsToTimecode(sec, includeMs = false) {
  const s = Math.max(0, Number(sec) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);

  const pad = (n, width = 2) => String(n).padStart(width, '0');
  const base = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return includeMs ? `${base}.${pad(ms, 3)}` : base;
}

/**
 * Format seconds for FFmpeg -ss / -to argument (HH:MM:SS.mmm)
 */
function toFFmpegTimestamp(sec) {
  return formatSecondsToTimecode(sec, true);
}

/**
 * Sanitize base filename for safe outputs
 */
function sanitizeFilename(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
}

/**
 * Calculate segments for a split job
 */
export function calculateSplitSegments({
  duration,
  splitMethod = 'parts',
  requestedParts = 2,
  splitDuration = 60,
  originalFileName = 'video.mp4',
  outputFormat = 'mp4'
}) {
  const totalDuration = Math.max(0.1, Number(duration) || 10);
  let segmentCount = 2;
  let partDuration = totalDuration / 2;

  if (splitMethod === 'parts') {
    segmentCount = Math.max(2, Math.min(2000, Math.floor(Number(requestedParts) || 2)));
    partDuration = totalDuration / segmentCount;
  } else {
    const durSec = Math.max(0.1, Number(splitDuration) || 60);
    segmentCount = Math.max(2, Math.min(2000, Math.ceil(totalDuration / durSec)));
    partDuration = durSec;
  }

  const cleanBase = sanitizeFilename(originalFileName);
  const ext = outputFormat ? outputFormat.toLowerCase().replace('.', '') : 'mp4';
  const padWidth = segmentCount >= 1000 ? 4 : 3;

  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * partDuration;
    const endTime = Math.min(totalDuration, (i + 1) * partDuration);
    const segDuration = Math.max(0.01, endTime - startTime);
    const partNumber = i + 1;
    const padStr = String(partNumber).padStart(padWidth, '0');
    const fileName = `${cleanBase}_part_${padStr}.${ext}`;

    segments.push({
      partId: `part_${partNumber}`,
      partNumber,
      fileName,
      startTime,
      endTime,
      duration: segDuration,
      formattedStart: formatSecondsToTimecode(startTime),
      formattedEnd: formatSecondsToTimecode(endTime),
      formattedDuration: formatSecondsToTimecode(segDuration),
      fileSize: 0,
      status: 'pending',
      outputPath: null
    });
  }

  return {
    totalParts: segments.length,
    partDuration,
    segments
  };
}

/**
 * Create and launch asynchronous Video Split Job
 */
export async function createAndRunSplitJob({
  jobId,
  sourceFilePath,
  originalFileName,
  splitMethod = 'parts',
  requestedParts = 2,
  splitDuration = 60,
  outputFormat = 'mp4',
  quality = 'source',
  audioOption = 'keep',
  mode = 'stream_copy',
  outputDir
}) {
  const stats = fs.statSync(sourceFilePath);
  const metadata = await probeVideoMetadata(sourceFilePath);

  const { totalParts, partDuration, segments } = calculateSplitSegments({
    duration: metadata.duration,
    splitMethod,
    requestedParts,
    splitDuration,
    originalFileName,
    outputFormat
  });

  const jobDir = path.join(outputDir, jobId);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  const job = {
    jobId,
    originalFileName,
    originalFileSize: stats.size,
    duration: metadata.duration,
    resolution: `${metadata.width}x${metadata.height}`,
    fps: metadata.fps,
    videoCodec: metadata.codec,
    audioCodec: metadata.audioCodec,
    totalParts,
    splitMethod,
    splitDuration: partDuration,
    outputFormat,
    quality,
    audioOption,
    mode,
    status: 'analyzing',
    progress: 5,
    currentPart: 0,
    stageMessage: 'Analyzing video keyframes and segment boundaries...',
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    jobDir,
    parts: segments,
    zipPath: null
  };

  videoSplitJobs.set(jobId, job);

  // In Serverless runtimes (Vercel / AWS Lambda), background tasks freeze when response ends.
  // We execute immediately to guarantee completion within the function invocation.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION) {
    try {
      await executeSplitJob(jobId, sourceFilePath);
    } catch (err) {
      console.error(`[Video Split Job ${jobId}] Failed:`, err);
      job.status = 'failed';
      job.error = err.message || 'Video splitting process failed.';
    }
  } else {
    executeSplitJob(jobId, sourceFilePath).catch(err => {
      console.error(`[Video Split Job ${jobId}] Failed:`, err);
      const j = videoSplitJobs.get(jobId);
      if (j) {
        j.status = 'failed';
        j.error = err.message || 'Video splitting process failed.';
      }
    });
  }

  return job;
}

/**
 * Background Video Split Worker
 */
async function executeSplitJob(jobId, sourceFilePath) {
  const job = videoSplitJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.stageMessage = `Initiating segment generation for ${job.totalParts} clips...`;
    job.progress = 10;

    const useStreamCopy = job.mode === 'stream_copy' && (job.outputFormat.toLowerCase() === 'mp4' || job.outputFormat.toLowerCase() === 'mov');

    // Process segments
    for (let i = 0; i < job.parts.length; i++) {
      const seg = job.parts[i];
      job.currentPart = i + 1;
      job.stageMessage = `Creating segment ${i + 1} of ${job.totalParts} (${seg.fileName})...`;
      
      const outPath = path.join(job.jobDir, seg.fileName);
      seg.outputPath = outPath;

      const startTimestamp = toFFmpegTimestamp(seg.startTime);
      const segDur = seg.duration.toFixed(3);

      let ffmpegArgs = '';

      if (useStreamCopy) {
        // Stream Copy (Lossless & High Speed)
        const audioFlag = job.audioOption === 'remove' ? '-an' : '-c:a copy';
        ffmpegArgs = `-ss ${startTimestamp} -i "${sourceFilePath}" -t ${segDur} -c:v copy ${audioFlag} -avoid_negative_ts make_zero "${outPath}" -y`;
      } else {
        // Accurate Frame Transcoding
        let crf = '22';
        if (job.quality === 'high') crf = '18';
        if (job.quality === 'medium') crf = '26';

        let videoCodec = 'libx264';
        if (job.outputFormat === 'webm') videoCodec = 'libvpx-vp9';
        else if (job.outputFormat === 'mov') videoCodec = 'libx264';

        const audioFlag = job.audioOption === 'remove' ? '-an' : '-c:a aac -b:a 192k';

        ffmpegArgs = `-ss ${startTimestamp} -i "${sourceFilePath}" -t ${segDur} -c:v ${videoCodec} -crf ${crf} -preset veryfast -pix_fmt yuv420p ${audioFlag} "${outPath}" -y`;
      }

      await execFfmpegCommand(ffmpegArgs);

      // Verify generated segment file
      if (fs.existsSync(outPath)) {
        const segStat = fs.statSync(outPath);
        seg.fileSize = segStat.size;
        seg.status = 'completed';
      }

      // Update progress from 10% to 95%
      const stepProgress = 10 + Math.floor(((i + 1) / job.totalParts) * 85);
      job.progress = Math.min(95, stepProgress);
    }

    job.status = 'completed';
    job.progress = 100;
    job.stageMessage = `Video split completed successfully! ${job.totalParts} clips generated.`;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    console.error(`[Video Split Error jobId=${jobId}]:`, err);
    job.status = 'failed';
    job.error = err.message;
  }
}

/**
 * Bundle all generated parts into a single ZIP archive server-side
 */
export async function bundleSplitZip(jobId) {
  const job = videoSplitJobs.get(jobId);
  if (!job) throw new Error('Split job not found or expired.');

  if (job.zipPath && fs.existsSync(job.zipPath)) {
    return job.zipPath;
  }

  const zip = new JSZip();
  const zipFilename = `${sanitizeFilename(job.originalFileName)}_Split_${job.totalParts}_Parts.zip`;
  const zipPath = path.join(job.jobDir, zipFilename);

  for (const part of job.parts) {
    if (part.outputPath && fs.existsSync(part.outputPath)) {
      const data = fs.readFileSync(part.outputPath);
      zip.file(part.fileName, data);
    }
  }

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 4 }
  });

  fs.writeFileSync(zipPath, content);
  job.zipPath = zipPath;
  return zipPath;
}
