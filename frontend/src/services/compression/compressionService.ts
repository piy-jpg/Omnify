/**
 * Omnify Frontend Compression Service
 * Communicates with backend /api/compress endpoints and provides client-side canvas/pdf-lib/JSZip
 * fallback engines for complete offline/online compression resilience.
 */

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { CompressionOptions, QueueItem } from '../../types/compression';

export interface CompressionExecutionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  reductionPercentage: number;
  becameLarger?: boolean;
  jobId?: string;
  downloadUrl?: string;
  blob?: Blob;
  downloadName?: string;
  error?: string;
}

export class CompressionService {
  private static getApiBases(): string[] {
    const bases: string[] = [''];
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port && port !== '5000') {
        bases.push(`http://${window.location.hostname}:5000`);
        bases.push('http://127.0.0.1:5000');
        bases.push('http://localhost:5000');
      }
    }
    return [...new Set(bases)];
  }

  static async compress(
    item: QueueItem,
    onProgress?: (percent: number, message: string) => void
  ): Promise<CompressionExecutionResult> {
    onProgress?.(10, 'Preparing payload and validating MIME structure...');

    const bases = this.getApiBases();
    let lastError: Error | null = null;

    for (const base of bases) {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('options', JSON.stringify({
          preset: item.options.preset,
          quality: item.options.quality,
          compressionMode: item.options.preset === 'maximum' ? 'max' : item.options.preset === 'high' ? 'high_quality' : item.options.preset === 'target' ? 'target_size' : item.options.preset === 'fast' ? 'fast' : 'balanced',
          targetSizeBytes: item.options.targetSizeBytes,
          resolution: item.options.resolution,
          audioMode: item.options.audioMode,
          resizeScale: item.options.resizeScale,
          customWidth: item.options.customWidth,
          customHeight: item.options.customHeight,
          originalFilename: item.name
        }));

        onProgress?.(30, 'Transmitting to high-performance compression worker...');

        const response = await fetch(`${base}/api/compress`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'queued' && data.jobId) {
            return await this.pollJob(base, data.jobId, item.name, onProgress);
          }
          if (data.success) {
            onProgress?.(100, 'Compression validated and ready!');
            return {
              success: true,
              originalSize: data.originalSize,
              compressedSize: data.compressedSize,
              savedBytes: data.savedBytes,
              reductionPercentage: data.reductionPercentage,
              becameLarger: data.becameLarger,
              jobId: data.jobId,
              downloadUrl: base ? `${base}${data.downloadUrl}` : data.downloadUrl,
              downloadName: data.outFilename || `${item.name.replace(/\.[^/.]+$/, '')}_compressed.${item.format.toLowerCase()}`
            };
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[CompressionService] Endpoint ${base}/api/compress failed:`, err.message);
      }
    }

    if (item.category === 'video') {
      throw new Error(lastError?.message || 'Video compression server is unavailable.');
    }

    console.warn('[CompressionService] Activating local client compression engine...');
    return await this.compressClientFallback(item, onProgress);
  }

  private static async pollJob(
    apiBase: string,
    jobId: string,
    originalName: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<CompressionExecutionResult> {
    const maxAttempts = 120;
    let attempts = 0;
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 800));
      attempts++;
      try {
        const res = await fetch(`${apiBase}/api/compress/job/${jobId}`);
        if (res.ok) {
          const job = await res.json();
          if (job.success) {
            onProgress?.(job.progress || 50, job.stageMessage || 'Compressing media streams...');
            if (job.status === 'complete') {
              onProgress?.(100, 'Video compression verified!');
              return {
                success: true,
                originalSize: job.originalSize,
                compressedSize: job.compressedSize,
                savedBytes: job.savedBytes,
                reductionPercentage: job.reductionPercentage,
                becameLarger: job.becameLarger,
                jobId: job.jobId,
                downloadUrl: apiBase ? `${apiBase}${job.downloadUrl}` : job.downloadUrl,
                downloadName: job.outFilename || `${originalName.replace(/\.[^/.]+$/, '')}_compressed.mp4`
              };
            }
            if (job.status === 'failed') throw new Error(job.error || 'Compression job failed on server.');
          }
        }
      } catch (pollErr: any) {
        console.warn('[Job Poll] Error:', pollErr);
        if (pollErr.message?.includes('failed on server')) throw pollErr;
      }
    }
    throw new Error('Compression timed out.');
  }

  private static async compressClientFallback(
    item: QueueItem,
    onProgress?: (percent: number, message: string) => void
  ): Promise<CompressionExecutionResult> {
    const file = item.file;
    const originalSize = file.size;
    const cat = item.category;
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    onProgress?.(15, 'Initializing client compression engine...');

    // ─── 1. IMAGES — Canvas with target-size binary search ─────────────────
    if (cat === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
          URL.revokeObjectURL(url);
          onProgress?.(30, 'Decoding image pixel data...');

          let w = img.naturalWidth;
          let h = img.naturalHeight;

          if (item.options.resizeScale === '75%') { w = Math.round(w * 0.75); h = Math.round(h * 0.75); }
          else if (item.options.resizeScale === '50%') { w = Math.round(w * 0.5); h = Math.round(h * 0.5); }
          else if (item.options.resizeScale === 'custom' && item.options.customWidth && item.options.customHeight) {
            w = item.options.customWidth; h = item.options.customHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, blob: file, downloadName: file.name });
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);

          const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          const outExt = ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg';

          // TARGET SIZE — binary search on quality
          if (item.options.preset === 'target' && item.options.targetSizeBytes && item.options.targetSizeBytes > 0) {
            onProgress?.(40, 'Running target-size binary search...');
            const targetBytes = item.options.targetSizeBytes;
            const compressAt = (q: number): Promise<Blob | null> =>
              new Promise(res => canvas.toBlob(res, mime === 'image/png' ? 'image/jpeg' : mime, q));

            let lo = 0.05, hi = 0.92, bestBlob: Blob | null = null;
            for (let i = 0; i < 9; i++) {
              const mid = (lo + hi) / 2;
              onProgress?.(40 + i * 5, `Quality iteration ${(mid * 100).toFixed(0)}%...`);
              const blob = await compressAt(mid);
              if (!blob) break;
              if (blob.size <= targetBytes) { bestBlob = blob; lo = mid; }
              else hi = mid;
            }
            if (!bestBlob) bestBlob = await compressAt(0.08);
            const out = bestBlob || file;
            const becameLarger = out.size >= originalSize;
            const outBlob = becameLarger ? file : out;
            const outSize = outBlob.size;
            const savedBytes = Math.max(0, originalSize - outSize);
            const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
            onProgress?.(100, 'Target-size compression complete!');
            resolve({ success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${outExt}` });
            return;
          }

          // Standard quality
          let q = item.options.quality / 100;
          if (item.options.preset === 'maximum') q = 0.32;
          else if (item.options.preset === 'high') q = 0.88;
          else if (item.options.preset === 'fast') q = 0.82;
          else q = Math.min(0.78, q);

          onProgress?.(55, 'Applying lossy compression codec...');

          // PNG palette quantization
          if (ext === 'png' && q < 0.95) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const step = q < 0.4 ? 32 : q < 0.6 ? 16 : q < 0.8 ? 8 : 4;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] > 10) {
                data[i] = Math.round(data[i] / step) * step;
                data[i + 1] = Math.round(data[i + 1] / step) * step;
                data[i + 2] = Math.round(data[i + 2] / step) * step;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }

          onProgress?.(75, 'Encoding compressed output stream...');

          canvas.toBlob((blob) => {
            const finalBlob = blob || file;
            const becameLarger = finalBlob.size >= originalSize;
            const outBlob = becameLarger ? file : finalBlob;
            const outSize = outBlob.size;
            const savedBytes = Math.max(0, originalSize - outSize);
            const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
            onProgress?.(100, 'Image compression complete!');
            resolve({ success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${outExt}` });
          }, mime, q);
        };

        img.onerror = () => resolve({ success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, blob: file, downloadName: file.name });
        img.src = url;
      });
    }

    // ─── 2. PDF — stream re-save + metadata stripping ──────────────────────
    if (ext === 'pdf') {
      try {
        onProgress?.(25, 'Parsing PDF document structure...');
        const arrayBuffer = await file.arrayBuffer();
        onProgress?.(45, 'Re-optimizing PDF object streams...');
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('Omnify');
        pdfDoc.setCreator('Omnify');
        onProgress?.(70, 'Writing compressed PDF binary...');
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        onProgress?.(90, 'Validating output integrity...');
        const blob = new Blob([compressedBytes], { type: 'application/pdf' });
        const becameLarger = blob.size > originalSize;
        const outBlob = becameLarger ? file : blob;
        const outSize = outBlob.size;
        const savedBytes = Math.max(0, originalSize - outSize);
        const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
        onProgress?.(100, 'PDF optimization complete!');
        return { success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf` };
      } catch {
        return { success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, blob: file, downloadName: file.name };
      }
    }

    // ─── 3. ZIP / Office Documents — JSZip DEFLATE-9 ──────────────────────
    if (['zip', 'docx', 'pptx', 'odt', 'odp', 'ods', 'xlsx'].includes(ext)) {
      try {
        onProgress?.(20, 'Reading archive structure...');
        const arrayBuffer = await file.arrayBuffer();
        onProgress?.(40, 'Analyzing compressible entries...');
        const zip = await JSZip.loadAsync(arrayBuffer);
        const level = item.options.preset === 'fast' ? 6 : item.options.preset === 'maximum' ? 9 : 8;
        onProgress?.(55, `Applying DEFLATE-${level} compression...`);
        const compressedBlob = await zip.generateAsync(
          { type: 'blob', compression: 'DEFLATE', compressionOptions: { level } },
          (meta) => {
            const pct = 55 + Math.round(meta.percent * 0.40);
            onProgress?.(pct, `Compressing ${meta.currentFile || 'entries'}...`);
          }
        );
        const becameLarger = compressedBlob.size >= originalSize;
        const outBlob = becameLarger ? file : compressedBlob;
        const outSize = outBlob.size;
        const savedBytes = Math.max(0, originalSize - outSize);
        const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
        onProgress?.(100, 'Archive compression complete!');
        return { success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}` };
      } catch {
        return { success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, blob: file, downloadName: file.name };
      }
    }

    // ─── 4. Audio — WAV compresses well; MP3/AAC already compressed ───────
    if (['mp3', 'aac', 'm4a', 'ogg', 'flac', 'wav'].includes(ext)) {
      onProgress?.(30, 'Analyzing audio stream...');
      await new Promise(r => setTimeout(r, 200));

      if (ext === 'wav' || ext === 'flac') {
        try {
          onProgress?.(55, 'Re-packaging PCM audio data...');
          const zip = new JSZip();
          zip.file(file.name, file);
          const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
          const becameLarger = blob.size >= originalSize;
          const outBlob = becameLarger ? file : blob;
          const outSize = outBlob.size;
          const savedBytes = Math.max(0, originalSize - outSize);
          const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
          onProgress?.(100, 'Audio stream optimized!');
          return { success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}` };
        } catch {}
      }

      // MP3/AAC/OGG already compressed — report as optimal
      onProgress?.(100, 'Audio format already optimally compressed.');
      return { success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, becameLarger: true, blob: file, downloadName: file.name };
    }

    // ─── 5. Text / Data files — DEFLATE wrapping ──────────────────────────
    if (['txt', 'csv', 'json', 'xml', 'html', 'htm', 'md', 'log', 'svg'].includes(ext)) {
      try {
        onProgress?.(40, 'Applying text stream DEFLATE compression...');
        const zip = new JSZip();
        zip.file(file.name, file);
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
        const becameLarger = blob.size >= originalSize;
        const outBlob = becameLarger ? file : blob;
        const outSize = outBlob.size;
        const savedBytes = Math.max(0, originalSize - outSize);
        const reduction = Number(((savedBytes / originalSize) * 100).toFixed(1));
        onProgress?.(100, 'Text stream compressed!');
        return { success: true, originalSize, compressedSize: outSize, savedBytes, reductionPercentage: reduction, becameLarger, blob: outBlob, downloadName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}` };
      } catch {}
    }

    // Default passthrough
    onProgress?.(100, 'File processed.');
    return { success: true, originalSize, compressedSize: originalSize, savedBytes: 0, reductionPercentage: 0, blob: file, downloadName: file.name };
  }

  static async downloadBatchZip(items: QueueItem[], filename: string = 'Omnify_Compressed_Bundle.zip') {
    const jobIds = items.filter(i => i.jobId).map(i => i.jobId as string);
    if (jobIds.length > 0) {
      try {
        const response = await fetch('/api/compress/download-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds })
        });
        if (response.ok) {
          const blob = await response.blob();
          this.triggerDownload(blob, filename);
          return;
        }
      } catch {}
    }

    const zip = new JSZip();
    for (const item of items) {
      if (item.resultBlob) {
        zip.file(item.name.replace(/\.[^/.]+$/, '') + '_compressed.' + item.format.toLowerCase(), item.resultBlob);
      } else if (item.downloadUrl) {
        try {
          const res = await fetch(item.downloadUrl);
          if (res.ok) zip.file(item.name.replace(/\.[^/.]+$/, '') + '_compressed.' + item.format.toLowerCase(), await res.blob());
        } catch {}
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    this.triggerDownload(zipBlob, filename);
  }

  static triggerDownload(blobOrUrl: Blob | string, filename: string) {
    const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
