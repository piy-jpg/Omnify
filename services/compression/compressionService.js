/**
 * ConvertPro Master Compression Service
 * Handles MIME/magic-bytes detection, file analysis & smart recommendations,
 * format-specific routing, async job queuing & progress tracking, and batch zip packaging.
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { compressPDF } from './pdfCompressor.js';
import { compressImage } from './imageCompressor.js';
import { compressDOCX } from './documentCompressor.js';
import { compressPPTX } from './presentationCompressor.js';
import { compressVideo, probeVideoMetadata } from './videoCompressor.js';
import { compressZIP } from './zipCompressor.js';

// In-memory active compression jobs store
export const compressionJobs = new Map();

/**
 * Detect file format using extension and magic bytes
 */
export function detectFormat(filePath, originalFilename = '') {
  const ext = (path.extname(originalFilename || filePath) || '').toLowerCase();
  
  // Read first 16 bytes for magic bytes verification
  let magicHex = '';
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    magicHex = buffer.toString('hex').toUpperCase();
  } catch {}

  // PDF: %PDF (25504446)
  if (magicHex.startsWith('25504446') || ext === '.pdf') {
    return { type: 'pdf', category: 'document', ext: 'pdf', mime: 'application/pdf' };
  }

  // PNG: 89504E470D0A1A0A
  if (magicHex.startsWith('89504E47') || ext === '.png') {
    return { type: 'png', category: 'image', ext: 'png', mime: 'image/png' };
  }

  // JPG / JPEG: FFD8FF
  if (magicHex.startsWith('FFD8FF') || ext === '.jpg' || ext === '.jpeg') {
    return { type: 'jpg', category: 'image', ext: 'jpg', mime: 'image/jpeg' };
  }

  // WEBP: RIFF....WEBP (52494646....57454250)
  if (magicHex.startsWith('52494646') || ext === '.webp') {
    return { type: 'webp', category: 'image', ext: 'webp', mime: 'image/webp' };
  }

  // ZIP / DOCX / PPTX: PK.. (504B0304)
  if (magicHex.startsWith('504B0304') || ['.docx', '.pptx', '.zip'].includes(ext)) {
    if (ext === '.docx') return { type: 'docx', category: 'document', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    if (ext === '.pptx') return { type: 'pptx', category: 'presentation', ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
    return { type: 'zip', category: 'archive', ext: 'zip', mime: 'application/zip' };
  }

  // Video Formats (MP4, MOV, WEBM, AVI)
  if (['.mp4', '.mov', '.webm', '.avi', '.m4v', '.mkv'].includes(ext)) {
    const cleanExt = ext.replace('.', '');
    return {
      type: cleanExt === 'm4v' ? 'mp4' : cleanExt,
      category: 'video',
      ext: cleanExt,
      mime: cleanExt === 'webm' ? 'video/webm' : cleanExt === 'mov' ? 'video/quicktime' : 'video/mp4'
    };
  }

  return { type: ext.replace('.', '') || 'unknown', category: 'general', ext: ext.replace('.', '') || 'bin', mime: 'application/octet-stream' };
}

/**
 * Deep File Analysis & Smart Recommendations
 */
export async function analyzeFile(filePath, originalFilename = '') {
  const format = detectFormat(filePath, originalFilename);
  const stats = fs.statSync(filePath);
  const size = stats.size;

  const result = {
    fileName: originalFilename || path.basename(filePath),
    fileSize: size,
    format: format.type,
    category: format.category,
    mimeType: format.mime,
    details: {},
    recommendations: []
  };

  if (format.category === 'video') {
    const meta = await probeVideoMetadata(filePath);
    result.details = {
      width: meta.width,
      height: meta.height,
      resolution: `${meta.width}x${meta.height}`,
      duration: meta.duration,
      durationFormatted: `${Math.floor(meta.duration / 60)}m ${Math.round(meta.duration % 60)}s`,
      fps: meta.fps,
      bitrate: meta.bitrate,
      bitrateKbps: Math.round(meta.bitrate / 1000),
      codec: meta.codec,
      audioCodec: meta.audioCodec
    };

    if (meta.width > 1280 || meta.height > 720) {
      result.recommendations.push({
        title: 'Downscale to 720p',
        description: 'Downscaling from high resolution to 720p HD can reduce file size by up to 65% with minimal perceptual loss.',
        suggestedSetting: { resolution: '720p', compressionMode: 'balanced' }
      });
    } else if (meta.bitrate > 3500000) {
      result.recommendations.push({
        title: 'Balanced Bitrate Optimization',
        description: 'Original video has high bitrate. Balanced CRF encoding will significantly lower the file size.',
        suggestedSetting: { compressionMode: 'balanced' }
      });
    }
  } else if (format.type === 'docx' || format.type === 'pptx') {
    try {
      const buffer = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(buffer);
      const prefix = format.type === 'docx' ? 'word/media/' : 'ppt/media/';
      const mediaList = Object.keys(zip.files).filter(f => f.startsWith(prefix));
      
      let totalMediaSize = 0;
      for (const m of mediaList) {
        const entry = zip.file(m);
        if (entry) {
          const b = await entry.async('nodebuffer');
          totalMediaSize += b.length;
        }
      }

      result.details = {
        embeddedMediaCount: mediaList.length,
        totalMediaBytes: totalMediaSize,
        mediaPercentage: size > 0 ? Math.round((totalMediaSize / size) * 100) : 0
      };

      if (mediaList.length > 0 && totalMediaSize > 1024 * 1024) {
        result.recommendations.push({
          title: 'Optimize Embedded Presentation Images',
          description: `Detected ${mediaList.length} embedded images (${(totalMediaSize / 1024 / 1024).toFixed(1)} MB). Balanced media compression can save up to 60%.`,
          suggestedSetting: { compressionMode: 'balanced' }
        });
      }
    } catch {}
  } else if (format.category === 'image') {
    if (size > 2 * 1024 * 1024) {
      result.recommendations.push({
        title: 'High Efficiency Image Compression',
        description: 'Large image detected (> 2 MB). Balanced quality compression can achieve 60-80% size reduction.',
        suggestedSetting: { compressionMode: 'balanced', quality: 80 }
      });
    }
  } else if (format.type === 'pdf') {
    if (size > 3 * 1024 * 1024) {
      result.recommendations.push({
        title: 'Stream & Object Compression',
        description: 'Removing uncompressed object streams & optimizing internal assets can noticeably reduce this PDF.',
        suggestedSetting: { compressionMode: 'balanced' }
      });
    }
  }

  return result;
}

/**
 * Master Compression Dispatcher
 */
export async function processCompression(inputPath, outputPath, options = {}, onProgress = null) {
  const originalFilename = options.originalFilename || path.basename(inputPath);
  const format = detectFormat(inputPath, originalFilename);

  console.log(`[Master Compressor] Processing ${originalFilename} as ${format.type} (${format.category})`);

  if (format.type === 'pdf') {
    const { compressPDF } = await import(`./pdfCompressor.js?t=${Date.now()}`);
    return await compressPDF(inputPath, outputPath, options);
  }

  if (format.category === 'image') {
    const { compressImage } = await import(`./imageCompressor.js?t=${Date.now()}`);
    return await compressImage(inputPath, outputPath, options);
  }

  if (format.type === 'docx') {
    const { compressDOCX } = await import(`./documentCompressor.js?t=${Date.now()}`);
    return await compressDOCX(inputPath, outputPath, options);
  }

  if (format.type === 'pptx') {
    const { compressPPTX } = await import(`./presentationCompressor.js?t=${Date.now()}`);
    return await compressPPTX(inputPath, outputPath, options);
  }

  if (format.category === 'video') {
    const { compressVideo } = await import(`./videoCompressor.js?t=${Date.now()}`);
    return await compressVideo(inputPath, outputPath, options, onProgress);
  }

  if (format.type === 'zip') {
    const { compressZIP } = await import(`./zipCompressor.js?t=${Date.now()}`);
    return await compressZIP(inputPath, outputPath, options);
  }

  // Default fallback for unrecognized formats
  fs.copyFileSync(inputPath, outputPath);
  const stats = fs.statSync(outputPath);
  return {
    success: true,
    originalSize: stats.size,
    compressedSize: stats.size,
    savedBytes: 0,
    reductionPercentage: 0,
    becameLarger: false,
    warning: 'File format preserved without transformation.'
  };
}

/**
 * Package a batch of compressed files into a single ZIP bundle
 */
export async function bundleBatchZip(fileList, outputZipPath) {
  const zip = new JSZip();

  for (const item of fileList) {
    if (fs.existsSync(item.filePath)) {
      const buffer = fs.readFileSync(item.filePath);
      zip.file(item.downloadName || path.basename(item.filePath), buffer);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(outputZipPath, zipBuffer);
  return {
    filePath: outputZipPath,
    size: zipBuffer.length
  };
}
