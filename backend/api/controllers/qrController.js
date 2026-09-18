import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PORT, QR_STORAGE_DIR } from '../../config/env.js';
import { QrShareModel } from '../../database/models/qrShareModel.js';
import { trackStorageUsage } from './storageController.js';

export function getNetworkInfo(req, res) {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ interface: name, address: net.address });
      }
    }
  }
  const primaryIp = addresses[0]?.address || '127.0.0.1';
  res.json({
    success: true,
    primaryIp,
    addresses,
    port: PORT
  });
}

export function handleQrUpload(req, res) {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided for upload.' });
  }

  const storedFiles = files.map(f => {
    trackStorageUsage(f.size);
    let fileSha256 = 'N/A';
    try {
      const buf = fs.readFileSync(f.path);
      fileSha256 = crypto.createHash('sha256').update(buf).digest('hex');
    } catch (e) {}

    return {
      id: f.filename,
      fileId: f.filename,
      storageKey: f.filename,
      name: f.originalname,
      originalName: f.originalname,
      size: f.size,
      type: f.mimetype,
      mimeType: f.mimetype,
      sha256: fileSha256,
      contentHash: fileSha256,
      serverPath: `/api/qr/file/${encodeURIComponent(f.filename)}`,
      uploadedAt: 'Just now'
    };
  });

  res.json({ success: true, files: storedFiles });
}

export function handleGetQrFile(req, res) {
  const rawId = req.params.fileId;
  const safeFilename = path.basename(rawId);
  let filePath = path.join(QR_STORAGE_DIR, safeFilename);

  // If not direct disk filename, search in QrShareModel
  if (!fs.existsSync(filePath)) {
    try {
      const records = Object.values(QrShareModel.getAll());
      for (const rec of records) {
        const matched = rec.files?.find(f => f.id === rawId || f.id === safeFilename || f.serverPath?.includes(rawId) || f.serverPath?.includes(safeFilename));
        if (matched && matched.serverPath) {
          const diskName = path.basename(matched.serverPath.split('?')[0]);
          const candidate = path.join(QR_STORAGE_DIR, diskName);
          if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[QR Controller] Error looking up file by ID:', e);
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired.' });
  }

  let fileSha256 = 'N/A';
  try {
    const buf = fs.readFileSync(filePath);
    fileSha256 = crypto.createHash('sha256').update(buf).digest('hex');
  } catch {}

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-SHA256', fileSha256);

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.txt': 'text/plain',
    '.json': 'application/json'
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }

  if (req.query.download === 'true') {
    res.download(filePath, safeFilename.replace(/^\d+-\d+-/, ''));
  } else {
    fs.createReadStream(filePath).pipe(res);
  }
}

export function handleSaveRecord(req, res) {
  const record = req.body;
  if (!record || !record.shareId) {
    return res.status(400).json({ error: 'Invalid QR record.' });
  }

  try {
    if (record.files && Array.isArray(record.files)) {
      record.files = record.files.map(f => {
        const rawBase64 = f.dataUrl || f.data;
        if (rawBase64 && typeof rawBase64 === 'string' && rawBase64.startsWith('data:') && !f.serverPath) {
          try {
            const matches = rawBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const buffer = Buffer.from(matches[2], 'base64');
              const cleanBase = path.basename(f.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
              const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${cleanBase}`;
              const filePath = path.join(QR_STORAGE_DIR, uniqueFilename);
              fs.writeFileSync(filePath, buffer);
              f.serverPath = `/api/qr/file/${encodeURIComponent(uniqueFilename)}`;
              f.sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
              f.contentHash = f.sha256;
              f.storageKey = uniqueFilename;
            }
          } catch (e) {
            console.warn('[QR Controller] Could not extract physical file from base64:', e);
          }
        }
        return f;
      });
    }

    const saved = QrShareModel.save(record.shareId, record);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ success: true, shareId: record.shareId, record: saved });
  } catch (err) {
    console.error('[QR Controller] Failed to persist QR record:', err);
    res.status(500).json({ error: 'Failed to persist QR record on server.' });
  }
}

export function handleGetShare(req, res) {
  const { shareId } = req.params;
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const found = QrShareModel.get(shareId);
    if (found) {
      found.scanCount = (found.scanCount || 0) + 1;
      found.lastScannedAt = 'Just now';
      QrShareModel.save(shareId, found);
      return res.json({ success: true, record: found });
    }
    res.status(404).json({ error: 'QR share link not found or expired.' });
  } catch (err) {
    console.error('[QR Controller] Error retrieving share page:', err);
    res.status(500).json({ error: 'Server error retrieving share page.' });
  }
}

export function handleDeleteShare(req, res) {
  const { shareId } = req.params;
  try {
    const deleted = QrShareModel.delete(shareId);
    res.json({ success: deleted });
  } catch {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
}
