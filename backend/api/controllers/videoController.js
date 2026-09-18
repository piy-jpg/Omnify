import path from 'path';
import fs from 'fs';
import { SPLIT_OUTPUT_DIR } from '../../config/env.js';
import {
  createAndRunSplitJob,
  videoSplitJobs,
  bundleSplitZip
} from '../../services/video/videoSplitterService.js';
import { trackStorageUsage } from './storageController.js';

export async function handleStartVideoSplit(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded.' });
    }

    const {
      splitMethod = 'parts',
      requestedParts = 2,
      splitDuration = 60,
      outputFormat = 'mp4',
      quality = 'source',
      audioOption = 'keep',
      mode = 'stream_copy'
    } = req.body;

    const jobId = `split_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const sourceFilePath = req.file.path;
    const originalFileName = req.file.originalname;

    trackStorageUsage(req.file.size);

    const job = await createAndRunSplitJob({
      jobId,
      sourceFilePath,
      originalFileName,
      splitMethod,
      requestedParts: Math.max(2, Math.min(2000, parseInt(requestedParts, 10) || 2)),
      splitDuration: Math.max(0.1, parseFloat(splitDuration) || 60),
      outputFormat: outputFormat || 'mp4',
      quality,
      audioOption,
      mode,
      outputDir: SPLIT_OUTPUT_DIR
    });

    res.json({
      success: true,
      jobId: job.jobId,
      originalFileName: job.originalFileName,
      originalFileSize: job.originalFileSize,
      duration: job.duration,
      resolution: job.resolution,
      fps: job.fps,
      videoCodec: job.videoCodec,
      audioCodec: job.audioCodec,
      totalParts: job.totalParts,
      splitMethod: job.splitMethod,
      splitDuration: job.splitDuration,
      status: job.status,
      progress: job.progress,
      stageMessage: job.stageMessage
    });
  } catch (err) {
    console.error('[Video Split API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to start video split process.' });
  }
}

export function handleGetVideoSplitJob(req, res) {
  const { jobId } = req.params;
  const job = videoSplitJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Video split job not found or expired.' });
  }

  const sanitizedParts = job.parts.map(p => ({
    partId: p.partId,
    partNumber: p.partNumber,
    fileName: p.fileName,
    startTime: p.startTime,
    endTime: p.endTime,
    duration: p.duration,
    formattedStart: p.formattedStart,
    formattedEnd: p.formattedEnd,
    formattedDuration: p.formattedDuration,
    fileSize: p.fileSize,
    status: p.status,
    downloadUrl: `/api/video/split/output/${job.jobId}/${p.partId}`,
    previewUrl: `/api/video/split/output/${job.jobId}/${p.partId}?preview=true`
  }));

  res.json({
    success: true,
    job: {
      jobId: job.jobId,
      originalFileName: job.originalFileName,
      originalFileSize: job.originalFileSize,
      duration: job.duration,
      resolution: job.resolution,
      fps: job.fps,
      videoCodec: job.videoCodec,
      audioCodec: job.audioCodec,
      totalParts: job.totalParts,
      splitMethod: job.splitMethod,
      splitDuration: job.splitDuration,
      outputFormat: job.outputFormat,
      status: job.status,
      progress: job.progress,
      currentPart: job.currentPart,
      stageMessage: job.stageMessage,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      parts: sanitizedParts
    }
  });
}

export function handleGetVideoSplitOutput(req, res) {
  const { jobId, partId } = req.params;
  const isPreview = req.query.preview === 'true';
  const job = videoSplitJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Split job not found or expired.' });
  }

  const part = job.parts.find(p => p.partId === partId || String(p.partNumber) === String(partId));
  if (!part || !part.outputPath || !fs.existsSync(part.outputPath)) {
    return res.status(404).json({ success: false, error: 'Requested video part file not found.' });
  }

  if (isPreview) {
    const ext = path.extname(part.outputPath).toLowerCase();
    let mimeType = 'video/mp4';
    if (ext === '.webm') mimeType = 'video/webm';
    if (ext === '.mov') mimeType = 'video/quicktime';
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(part.outputPath);
  }

  res.download(part.outputPath, part.fileName);
}

export async function handleDownloadVideoSplitZip(req, res) {
  try {
    const { jobId } = req.params;
    const zipPath = await bundleSplitZip(jobId);
    const zipFilename = path.basename(zipPath);
    res.download(zipPath, zipFilename);
  } catch (err) {
    console.error('[Video Split Download ZIP API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate ZIP archive.' });
  }
}
