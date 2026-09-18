import path from 'path';
import fs from 'fs';
import { COMPRESS_OUTPUT_DIR } from '../../config/env.js';
import {
  processCompression,
  analyzeFile,
  detectFormat,
  compressionJobs,
  bundleBatchZip
} from '../../services/compression/compressionService.js';

export async function handleAnalyzeCompression(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided for analysis.' });
    }

    const analysis = await analyzeFile(file.path, file.originalname);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error('[Compressor API] Analysis error:', err);
    res.status(500).json({ success: false, error: 'Failed to analyze file structure.' });
  }
}

export async function handleCompressSingle(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided for compression.' });
    }

    let options = {};
    if (req.body.options) {
      try {
        options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
      } catch {}
    }
    options.originalFilename = file.originalname;

    const jobId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const outFilename = `${baseName}_compressed_${Date.now().toString().slice(-4)}${ext}`;
    const outPath = path.join(COMPRESS_OUTPUT_DIR, outFilename);

    const job = {
      jobId,
      originalFilename: file.originalname,
      inputPath: file.path,
      outputPath: outPath,
      outFilename,
      status: 'compressing',
      progress: 15,
      stageMessage: 'Starting format-specific compression pipeline...',
      originalSize: file.size,
      compressedSize: null,
      savedBytes: 0,
      reductionPercentage: 0,
      downloadUrl: `/api/compress/output/${jobId}`,
      createdAt: Date.now()
    };
    compressionJobs.set(jobId, job);

    const format = detectFormat(file.path, file.originalname);
    const isAsyncHeavy = format.category === 'video' || file.size > 25 * 1024 * 1024;

    if (isAsyncHeavy) {
      (async () => {
        try {
          const result = await processCompression(file.path, outPath, options, (pct, msg) => {
            job.progress = pct;
            job.stageMessage = msg || 'Compressing media streams...';
          });

          job.status = 'complete';
          job.progress = 100;
          job.stageMessage = 'Compression successfully completed and verified.';
          job.compressedSize = result.compressedSize;
          job.savedBytes = result.savedBytes;
          job.reductionPercentage = result.reductionPercentage;
          job.becameLarger = result.becameLarger;
          job.result = result;
        } catch (err) {
          console.error(`[Compressor Async] Error for job ${jobId}:`, err);
          job.status = 'error';
          job.error = err.message || 'Compression pipeline failed.';
        }
      })();

      return res.json({
        success: true,
        mode: 'async',
        jobId,
        pollUrl: `/api/compress/job/${jobId}`,
        message: 'Compression job started in background'
      });
    }

    const result = await processCompression(file.path, outPath, options, (pct, msg) => {
      job.progress = pct;
      job.stageMessage = msg || 'Compressing...';
    });

    job.status = 'complete';
    job.progress = 100;
    job.stageMessage = 'Compression finished successfully.';
    job.compressedSize = result.compressedSize;
    job.savedBytes = result.savedBytes;
    job.reductionPercentage = result.reductionPercentage;
    job.becameLarger = result.becameLarger;
    job.result = result;

    return res.json({
      success: true,
      mode: 'sync',
      jobId,
      result: job
    });
  } catch (err) {
    console.error('[Compressor API] Compression error:', err);
    res.status(500).json({ success: false, error: err.message || 'Compression failed.' });
  }
}

export async function handleCompressBatch(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided for batch compression.' });
    }

    let batchOptions = {};
    if (req.body.options) {
      try {
        batchOptions = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
      } catch {}
    }

    const batchId = `batch-${Date.now()}`;
    const jobIds = [];

    for (const file of files) {
      const jobId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const outFilename = `${baseName}_compressed_${Date.now().toString().slice(-4)}${ext}`;
      const outPath = path.join(COMPRESS_OUTPUT_DIR, outFilename);

      const job = {
        jobId,
        batchId,
        originalFilename: file.originalname,
        inputPath: file.path,
        outputPath: outPath,
        outFilename,
        status: 'queued',
        progress: 0,
        stageMessage: 'Queued for processing...',
        originalSize: file.size,
        compressedSize: null,
        savedBytes: 0,
        reductionPercentage: 0,
        downloadUrl: `/api/compress/output/${jobId}`,
        createdAt: Date.now()
      };

      compressionJobs.set(jobId, job);
      jobIds.push(jobId);

      (async () => {
        try {
          job.status = 'compressing';
          const fileOpts = { ...batchOptions, originalFilename: file.originalname };
          const result = await processCompression(file.path, outPath, fileOpts, (pct, msg) => {
            job.progress = pct;
            job.stageMessage = msg;
          });

          job.status = 'complete';
          job.progress = 100;
          job.stageMessage = 'Compression completed.';
          job.compressedSize = result.compressedSize;
          job.savedBytes = result.savedBytes;
          job.reductionPercentage = result.reductionPercentage;
          job.becameLarger = result.becameLarger;
          job.result = result;
        } catch (err) {
          console.error(`[Batch Compressor] Error on ${file.originalname}:`, err);
          job.status = 'error';
          job.error = err.message || 'File compression failed.';
        }
      })();
    }

    res.json({
      success: true,
      batchId,
      jobIds,
      totalFiles: files.length,
      pollUrls: jobIds.map(id => `/api/compress/job/${id}`)
    });
  } catch (err) {
    console.error('[Compressor Batch API] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to start batch compression.' });
  }
}

export function handleGetCompressionJob(req, res) {
  const { jobId } = req.params;
  const job = compressionJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Compression job not found.' });
  }

  res.json({
    success: true,
    job: {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      stageMessage: job.stageMessage,
      originalFilename: job.originalFilename,
      originalSize: job.originalSize,
      compressedSize: job.compressedSize,
      savedBytes: job.savedBytes,
      reductionPercentage: job.reductionPercentage,
      becameLarger: job.becameLarger,
      downloadUrl: job.status === 'complete' ? job.downloadUrl : null,
      error: job.error || null,
      result: job.result || null
    }
  });
}

export function handleGetCompressionOutput(req, res) {
  const { jobId } = req.params;
  const job = compressionJobs.get(jobId);

  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({ success: false, error: 'Compressed file not found or expired.' });
  }

  const filename = job.outFilename || path.basename(job.outputPath);
  res.download(job.outputPath, filename);
}

export async function handleDownloadAllCompression(req, res) {
  try {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ success: false, error: 'jobIds array is required.' });
    }

    const validJobs = jobIds
      .map(id => compressionJobs.get(id))
      .filter(j => j && j.status === 'complete' && fs.existsSync(j.outputPath));

    if (validJobs.length === 0) {
      return res.status(404).json({ success: false, error: 'No ready compressed files found.' });
    }

    const zipFilename = `Omnify_Compressed_Batch_${Date.now()}.zip`;
    const zipPath = path.join(COMPRESS_OUTPUT_DIR, zipFilename);

    await bundleBatchZip(validJobs, zipPath);

    res.download(zipPath, zipFilename, (err) => {
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch {}
    });
  } catch (err) {
    console.error('[Compressor Download All] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to package files into ZIP.' });
  }
}
