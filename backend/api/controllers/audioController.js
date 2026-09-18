import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { CONVERTED_DIR } from '../../config/env.js';

const execAsync = promisify(exec);

export async function handleProcessAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No media file provided.' });
    }

    const { operation, targetFormat = 'mp3', startTime = 0, endTime = 60, bitrate = '256k' } = req.body;
    const inputPath = req.file.path;
    const cleanBase = path.basename(req.file.originalname).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const outExt = targetFormat.toLowerCase().replace('.', '');
    const outFilename = `audio_${Date.now()}_${cleanBase}.${outExt}`;
    const outputPath = path.join(CONVERTED_DIR, outFilename);

    let ffmpegCmd = '';

    if (operation === 'cut') {
      const safeStart = Math.max(0, parseFloat(startTime) || 0);
      const safeEnd = Math.max(safeStart + 0.1, parseFloat(endTime) || 60);
      ffmpegCmd = `ffmpeg -ss ${safeStart} -to ${safeEnd} -i "${inputPath}" -y "${outputPath}"`;
    } else if (operation === 'enhance') {
      const filter = 'highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=4,acompressor=threshold=-24dB:ratio=4:attack=5:release=50';
      ffmpegCmd = `ffmpeg -i "${inputPath}" -af "${filter}" -y "${outputPath}"`;
    } else if (operation === 'compress') {
      const compBitrate = bitrate || '96k';
      ffmpegCmd = `ffmpeg -i "${inputPath}" -b:a ${compBitrate} -ar 44100 -y "${outputPath}"`;
    } else if (operation === 'extract') {
      ffmpegCmd = `ffmpeg -i "${inputPath}" -vn -c:a libmp3lame -b:a 256k -y "${outputPath}"`;
    } else {
      ffmpegCmd = `ffmpeg -i "${inputPath}" -b:a ${bitrate} -y "${outputPath}"`;
    }

    console.log('[Audio Processing] Executing:', ffmpegCmd);
    await execAsync(ffmpegCmd);

    const stats = fs.statSync(outputPath);
    return res.json({
      success: true,
      fileName: outFilename,
      downloadUrl: `/api/download/${outFilename}`,
      size: stats.size,
      format: outExt.toUpperCase()
    });
  } catch (err) {
    console.error('[Audio Processing API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Audio processing failed.' });
  }
}
