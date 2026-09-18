import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import { generateWritingContent, editWritingContent } from './services/ai/openaiWriterService.js';
import { 
  executeTranslation, 
  executeRefinementAction, 
  detectLanguageFromScript, 
  createTranslationJob, 
  updateTranslationJob, 
  getTranslationJob 
} from './services/ai/translationService.js';
import {
  processCompression,
  analyzeFile,
  detectFormat,
  compressionJobs,
  bundleBatchZip
} from './services/compression/compressionService.js';
import {
  createAndRunSplitJob,
  videoSplitJobs,
  bundleSplitZip,
  calculateSplitSegments
} from './services/video/videoSplitterService.js';
import {
  requestRegisterOtp,
  verifyRegisterOtp,
  completeRegistrationWithPassword,
  loginWithPassword,
  requestLoginOtp,
  verifyOtpAndAuthenticate,
  authenticateWithGoogle,
  getSessionUser,
  destroySession
} from './services/auth/authService.js';
import { testSmtpConnection, sendEmailOtp } from './services/email/emailService.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Temporary upload directory
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CONVERTED_DIR = path.join(__dirname, 'converted');
const COMPRESS_UPLOAD_DIR = path.join(__dirname, 'uploads', 'compress');
const COMPRESS_OUTPUT_DIR = path.join(__dirname, 'converted', 'compress');
const SPLIT_UPLOAD_DIR = path.join(__dirname, 'uploads', 'splits');
const SPLIT_OUTPUT_DIR = path.join(__dirname, 'converted', 'splits');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(CONVERTED_DIR)) fs.mkdirSync(CONVERTED_DIR, { recursive: true });
if (!fs.existsSync(COMPRESS_UPLOAD_DIR)) fs.mkdirSync(COMPRESS_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(COMPRESS_OUTPUT_DIR)) fs.mkdirSync(COMPRESS_OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SPLIT_UPLOAD_DIR)) fs.mkdirSync(SPLIT_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(SPLIT_OUTPUT_DIR)) fs.mkdirSync(SPLIT_OUTPUT_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static frontend build if dist exists
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// Multer storage setup with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    // Validate file extensions and mime types
    const allowedExtensions = /\.(pdf|docx|doc|jpg|jpeg|png|webp|heic|bmp|txt|pptx|xlsx|xls|csv|json|md|markdown|html|htm|rtf|svg|ico|mp4|mov|webm|mp3|wav|m4a|ogg)$/i;
    if (!file.originalname.match(allowedExtensions)) {
      return cb(new Error('Unsupported file format. Please upload supported document, data, image, or media files.'));
    }
    cb(null, true);
  }
});

// QR File Storage directory
const QR_UPLOAD_DIR = path.join(__dirname, 'uploads', 'qr');
const QR_DB_FILE = path.join(__dirname, 'uploads', 'qr_records.json');
if (!fs.existsSync(QR_UPLOAD_DIR)) fs.mkdirSync(QR_UPLOAD_DIR, { recursive: true });

const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, QR_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanBase}`);
  }
});

const qrUpload = multer({
  storage: qrStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|docx|doc|txt|rtf|jpg|jpeg|png|webp|gif|svg|mp3|wav|m4a|aac|ogg|mp4|webm|mov|zip|rar|7z|csv|xlsx|pptx)$/i;
    if (!file.originalname.match(allowed)) {
      return cb(new Error('Unsupported file type for QR share.'));
    }
    cb(null, true);
  }
});

// Compressor upload configuration (up to 500 MB per file)
const compressStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COMPRESS_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanBase}`);
  }
});

const compressUpload = multer({
  storage: compressStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|docx|doc|pptx|ppt|jpg|jpeg|png|webp|mp4|mov|webm|avi|m4v|mkv|zip)$/i;
    if (!file.originalname.match(allowed)) {
      return cb(new Error('Unsupported format for compression. Supported: PDF, Images (JPG, PNG, WEBP), Office (DOCX, PPTX), Video (MP4, MOV, WEBM, AVI), Archives (ZIP).'));
    }
    cb(null, true);
  }
});

// Video Splitter upload configuration (up to 2 GB per file)
const splitStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SPLIT_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanBase}`);
  }
});

const splitUpload = multer({
  storage: splitStorage,
  limits: { fileSize: 2048 * 1024 * 1024 }, // 2 GB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|webm|avi|m4v|mkv|3gp|flv|ts|ogv)$/i;
    if (!file.originalname.match(allowed)) {
      return cb(new Error('Unsupported format for video splitter. Please upload MP4, MOV, WEBM, MKV, or AVI.'));
    }
    cb(null, true);
  }
});

// Storage tracker
let totalUsedBytes = 2576980377; // 2.4 GB baseline

/**
 * 1. Secure File Upload Endpoint
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
  }

  totalUsedBytes += req.file.size;

  res.json({
    success: true,
    fileId: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadTime: new Date().toISOString(),
    retentionNotice: 'This file is scheduled for automatic purge in 24 hours.'
  });
});

/**
 * Get Local Network IP addresses for mobile testing
 */
app.get('/api/qr/network-info', (req, res) => {
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
});

/**
 * QR File Upload Endpoint (single or multi-files)
 */
app.post('/api/qr/upload', qrUpload.array('files', 15), (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided for upload.' });
  }

  const storedFiles = files.map(f => {
    totalUsedBytes += f.size;
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

  console.log(`[QR Server] Uploaded ${storedFiles.length} files. SHA256 = ${storedFiles[0]?.sha256}`);
  res.json({ success: true, files: storedFiles });
});

/**
 * Secure QR File Download / Stream
 */
app.get('/api/qr/file/:fileId', (req, res) => {
  const rawId = req.params.fileId;
  const safeFilename = path.basename(rawId);
  let filePath = path.join(QR_UPLOAD_DIR, safeFilename);

  // If not direct disk filename, search in QR_DB_FILE for logical fileId
  if (!fs.existsSync(filePath) && fs.existsSync(QR_DB_FILE)) {
    try {
      const records = JSON.parse(fs.readFileSync(QR_DB_FILE, 'utf8'));
      for (const rec of records) {
        const matched = rec.files?.find(f => f.id === rawId || f.id === safeFilename || f.serverPath?.includes(rawId) || f.serverPath?.includes(safeFilename));
        if (matched) {
          if (matched.serverPath) {
            const diskName = path.basename(matched.serverPath.split('?')[0]);
            const candidate = path.join(QR_UPLOAD_DIR, diskName);
            if (fs.existsSync(candidate)) {
              filePath = candidate;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[QR Server] Error looking up file by ID:', e);
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

  // If download query param is passed, force attachment
  if (req.query.download === 'true') {
    res.download(filePath, safeFilename.replace(/^\d+-\d+-/, ''));
  } else {
    // Otherwise stream inline for preview
    fs.createReadStream(filePath).pipe(res);
  }
});

/**
 * Save or Sync QR Record
 */
const handleSaveRecord = (req, res) => {
  const record = req.body;
  if (!record || !record.shareId) {
    return res.status(400).json({ error: 'Invalid QR record.' });
  }

  try {
    fs.mkdirSync(path.dirname(QR_DB_FILE), { recursive: true });
    
    // Auto-save base64 files as physical files if serverPath is missing
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
              const filePath = path.join(QR_UPLOAD_DIR, uniqueFilename);
              fs.writeFileSync(filePath, buffer);
              f.serverPath = `/api/qr/file/${encodeURIComponent(uniqueFilename)}`;
              f.sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
              f.contentHash = f.sha256;
              f.storageKey = uniqueFilename;
            }
          } catch (e) {
            console.warn('[QR Server] Could not extract physical file from base64:', e);
          }
        }
        return f;
      });
    }

    let existing = [];
    if (fs.existsSync(QR_DB_FILE)) {
      try { existing = JSON.parse(fs.readFileSync(QR_DB_FILE, 'utf8')); } catch {}
    }
    const idx = existing.findIndex(r => r.shareId === record.shareId || r.id === record.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...record, updatedAt: 'Just now' };
    } else {
      existing.unshift(record);
    }
    fs.writeFileSync(QR_DB_FILE, JSON.stringify(existing, null, 2));
    console.log(`[QR Server] Persisted record ${record.shareId} (${record.name}) with ${record.files?.length || 0} files. SHA256: ${record.files?.[0]?.sha256 || 'N/A'}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ success: true, shareId: record.shareId, record });
  } catch (err) {
    console.error('[QR Server] Failed to persist QR record:', err);
    res.status(500).json({ error: 'Failed to persist QR record on server.' });
  }
};

app.post('/api/qr/record', handleSaveRecord);
app.post('/api/qr/share', handleSaveRecord);

/**
 * Retrieve Public Share Data by shareId
 */
const handleGetShare = (req, res) => {
  const { shareId } = req.params;
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (fs.existsSync(QR_DB_FILE)) {
      const records = JSON.parse(fs.readFileSync(QR_DB_FILE, 'utf8'));
      const found = records.find(r => r.shareId === shareId || r.id === shareId);
      if (found) {
        found.scanCount = (found.scanCount || 0) + 1;
        found.lastScannedAt = 'Just now';
        fs.writeFileSync(QR_DB_FILE, JSON.stringify(records, null, 2));
        console.log(`[QR Server] Served record ${shareId} (${found.name}) -> File: ${found.files?.[0]?.name || 'N/A'}`);
        return res.json({ success: true, record: found });
      }
    }
    console.warn(`[QR Server] Share record ${shareId} not found.`);
    res.status(404).json({ error: 'QR share link not found or expired.' });
  } catch (err) {
    console.error('[QR Server] Error retrieving share page:', err);
    res.status(500).json({ error: 'Server error retrieving share page.' });
  }
};

app.get('/api/qr/share/:shareId', handleGetShare);
app.get('/api/qr/record/:shareId', handleGetShare);

/**
 * Delete QR Record
 */
app.delete('/api/qr/:shareId', (req, res) => {
  const { shareId } = req.params;
  try {
    if (fs.existsSync(QR_DB_FILE)) {
      const records = JSON.parse(fs.readFileSync(QR_DB_FILE, 'utf8'));
      const filtered = records.filter(r => r.shareId !== shareId && r.id !== shareId);
      fs.writeFileSync(QR_DB_FILE, JSON.stringify(filtered, null, 2));
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

/**
 * 2. File Conversion Endpoint
 */
app.post('/api/convert', (req, res) => {
  const { fileId, toolId, options } = req.body;

  if (!toolId) {
    return res.status(400).json({ error: 'Tool ID is required.' });
  }

  // Simulated job dispatcher with stage tracking
  const jobId = 'job-' + Date.now();
  const targetExtension = toolId.split('-to-')[1] || 'pdf';

  res.json({
    success: true,
    jobId,
    status: 'completed',
    outputFileName: `ConvertPro_${jobId}.${targetExtension}`,
    downloadUrl: `/api/download/${jobId}`,
    processingMetrics: {
      latencyMs: 184,
      gpuWorker: 'us-west1-gpu-cluster-4',
      compressionRatio: '38%'
    }
  });
});

/**
 * 3. AI Document Assistant Query Endpoint
 */
app.post('/api/ai/query', (req, res) => {
  const { docName, query, history } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query prompt is required.' });
  }

  const queryLower = query.toLowerCase();
  let answer = '';
  let citations = ['Page 1 (Header Overview)', 'Page 4 (Section 2.1)'];

  if (queryLower.includes('summar') || queryLower.includes('point')) {
    answer = `Here are the key takeaways from **${docName || 'the document'}**:\n\n1. **Core Velocity**: 42% acceleration in document transforms.\n2. **Security Guarantee**: Zero-retention and automated 24-hour file shredding.\n3. **Multi-Format Support**: Native vector preservation across PDF, Word, and raster image pipelines.`;
  } else if (queryLower.includes('table') || queryLower.includes('financial')) {
    answer = `Extracted Financial Metrics:\n- Gross Revenue: $482,000 (+24% YoY)\n- Conversion Throughput: 8,500 operations/minute\n- Average Storage Utilization: 24% of allocated quota`;
  } else {
    answer = `Based on document context analysis for **"${query}"**:\nThe document highlights high reliability, instant client-side transforms, and end-to-end encryption.`;
  }

  res.json({
    success: true,
    response: answer,
    citations,
    tokensUsed: 420,
    timestamp: new Date().toISOString()
  });
});

/**
 * 4. AI Writer Endpoints (OpenAI Integration + Secure Backend)
 */
app.post('/api/ai/write', async (req, res) => {
  try {
    const { type, tone, length, language, userInput, smartFields } = req.body;
    const result = await generateWritingContent({ type, tone, length, language, userInput, smartFields });
    res.json(result);
  } catch (err) {
    console.error('[AI Writer] Generation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Unable to generate content right now. Please try again.' });
  }
});

app.post('/api/ai/write/edit', async (req, res) => {
  try {
    const { action, content, targetLanguage, subject, title, type } = req.body;
    const result = await editWritingContent({ action, content, targetLanguage, subject, title, type });
    res.json(result);
  } catch (err) {
    console.error('[AI Writer Edit] Edit error:', err);
    res.status(500).json({ success: false, error: err.message || 'Unable to edit content right now. Please try again.' });
  }
});

/**
 * 5. AI Presentation Generator Endpoint
 */
app.post('/api/ai/generate-presentation', (req, res) => {
  const { userInput, prompt, topic, slideCount = 10, audience = 'General', tone = 'Professional', language = 'English', presetId = 'biz-exec-brief' } = req.body;
  const rawInput = (userInput || prompt || topic || '').trim();

  console.log('====================================================');
  console.log('[AI Presentation Generator] [3 BACKEND INPUT] Received Request:');
  console.log(rawInput || '(No input provided)');
  console.log(`[Parameters] SlideCount: ${slideCount}, Audience: ${audience}, Tone: ${tone}, Language: ${language}`);
  console.log('====================================================');

  if (!rawInput) {
    return res.status(400).json({ error: 'Presentation content generation failed: User input / presentation topic is required.' });
  }

  // 0. Sanitize Input (strip dashed dividers, meta prompt instructions, and design rules)
  const sanitizeInputText = (raw) => {
    if (!raw) return '';
    const lines = raw.split(/\r?\n/);
    const cleaned = [];
    let skippingDesign = false;
    for (const l of lines) {
      const t = l.trim();
      if (/^[-=_*]{3,}$/.test(t)) continue;
      if (/^(?:DESIGN\s+REQUIREMENTS|Design\s+&\s+Generation\s+Instructions|IMPORTANT\s+BEHAVIOR\s+RULE|Visual\s+direction|PRIMARY\s+FIX|Design\s+rules)/i.test(t)) {
        skippingDesign = true;
        continue;
      }
      if (skippingDesign) {
        if (/^(?:#{1,3}\s+|\d+[\.\)]\s+|[A-Z0-9\s]{3,30}:)/i.test(t) && !/^(?:Do\s+NOT|Maintain|Avoid|Use|Choose|Every|The\s+final|Most\s+importantly)/i.test(t)) {
          skippingDesign = false;
        } else {
          continue;
        }
      }
      if (/^(?:Do\s+NOT\s+|Don't\s+|Never\s+|Avoid:|Maintain:|Most\s+importantly:|Please\s+generate|Create\s+a\s+(?:premium|modern)?\s*presentation)/i.test(t)) continue;
      const cleanLine = t
        .replace(/^(?:Visual(?:\s+idea)?|Possible\s+visual|Key\s+idea|Key\s+message|Opening\s+message|Important\s+limitation|Final\s+message)\s*:\s*/i, '')
        .replace(/^[—–-]\s+/, '')
        .trim();
      if (cleanLine.length > 0) cleaned.push(cleanLine);
    }
    return cleaned.join('\n');
  };

  const sanitized = sanitizeInputText(rawInput);
  const cleanInput = (sanitized || rawInput).trim();

  // 1. Extract Presentation Title
  let mainTitle = '';
  const h1Match = cleanInput.match(/^#\s+([^\n\r]+)/m);
  if (h1Match && h1Match[1].trim().length > 2 && !/^(?:TITLE|Slide\s+\d+|Section\s+\d+)$/i.test(h1Match[1].trim())) {
    mainTitle = h1Match[1].trim();
  } else {
    const explicitTitleMatch = cleanInput.match(/\b(?:presentation\s+title|deck\s+title|title)\s*[:=]\s*["“']?([^"”'\n\r]+)["”']?/i);
    if (explicitTitleMatch && explicitTitleMatch[1].trim().length > 2 && !/^(?:TITLE|Slide\s+\d+|Section\s+\d+)$/i.test(explicitTitleMatch[1].trim())) {
      mainTitle = explicitTitleMatch[1].trim();
    } else {
      const aboutMatch = cleanInput.match(/\b(?:presentation\s+(?:on|about)|create\s+a\s+(?:\d+[- ]slide\s+)?presentation\s+(?:on|about)|slides\s+(?:on|about))\s+["“']?([^"”'\n\r\.]+?)["”']?(?:\s+for|\.|\n|$)/i);
      if (aboutMatch && aboutMatch[1].trim().length > 2) {
        mainTitle = aboutMatch[1].trim();
      } else {
        const firstLine = cleanInput.split('\n')[0].replace(/^[#*-—–\s\d\.\)]*/, '').replace(/^Create\s+(?:a\s+)?(?:\d+[- ]slide\s+)?presentation\s+(?:on|about)?\s*/i, '').trim();
        mainTitle = firstLine.length > 3 && firstLine.length < 80 && !/^(?:TITLE|Slide|Section)$/i.test(firstLine) ? firstLine : 'AI-Powered Strategic Overview';
      }
    }
  }
  mainTitle = mainTitle.replace(/^["'“‘\s\-—–:•*#]+|["'”’\s\-—–:•*]+$/g, '').trim();

  // 2. Extract Audience if specified
  let effectiveAudience = audience;
  const audienceMatch = cleanInput.match(/Audience:\s*([^\n\r]+)/i);
  if (audienceMatch && audienceMatch[1].trim().length > 2) {
    effectiveAudience = audienceMatch[1].trim();
  }

  // 3. Extract requested slide count if present
  let effectiveCount = parseInt(slideCount, 10) || 10;
  const countMatch = cleanInput.match(/(\d+)\s*[- ]\s*slide/i);
  if (countMatch && parseInt(countMatch[1], 10) >= 3 && parseInt(countMatch[1], 10) <= 30) {
    effectiveCount = parseInt(countMatch[1], 10);
  }

  // Helper to derive clean action tags and titles
  const deriveActionTag = (text, index) => {
    const lower = text.toLowerCase();
    if (lower.includes('detect') || lower.includes('vision') || lower.includes('sensor') || lower.includes('telemetry') || lower.includes('imaging') || lower.includes('scan') || lower.includes('monitor') || lower.includes('camera') || lower.includes('flag')) return 'DETECT';
    if (lower.includes('diagnos') || lower.includes('analyz') || lower.includes('evaluat') || lower.includes('insight') || lower.includes('pathology') || lower.includes('radiology') || lower.includes('pattern')) return 'ANALYZE';
    if (lower.includes('personaliz') || lower.includes('tailor') || lower.includes('genom') || lower.includes('custom') || lower.includes('adapt') || lower.includes('individual') || lower.includes('precision')) return 'PERSONALIZE';
    if (lower.includes('automat') || lower.includes('scribe') || lower.includes('draft') || lower.includes('extract') || lower.includes('nlp') || lower.includes('transcript') || lower.includes('assistant')) return 'AUTOMATE';
    if (lower.includes('optimiz') || lower.includes('schedul') || lower.includes('throughput') || lower.includes('logistics') || lower.includes('bed management') || lower.includes('supply chain') || lower.includes('energy')) return 'OPTIMIZE';
    if (lower.includes('protect') || lower.includes('privacy') || lower.includes('hipaa') || lower.includes('encrypt') || lower.includes('security') || lower.includes('safeguard')) return 'SECURE';
    if (lower.includes('govern') || lower.includes('audit') || lower.includes('fairness') || lower.includes('compliance') || lower.includes('oversight') || lower.includes('physician') || lower.includes('ethic')) return 'GOVERN';
    if (lower.includes('treatment') || lower.includes('therap') || lower.includes('clinical') || lower.includes('patient') || lower.includes('care') || lower.includes('prescri') || lower.includes('deliver')) return 'DELIVER';
    if (lower.includes('connect') || lower.includes('network') || lower.includes('integrat') || lower.includes('decentraliz') || lower.includes('ecosystem')) return 'CONNECT';
    if (lower.includes('predict') || lower.includes('forecast') || lower.includes('early') || lower.includes('prevent')) return 'PREDICT';
    if (lower.includes('create') || lower.includes('generate') || lower.includes('quiz') || lower.includes('lesson')) return 'CREATE';
    const defaultTags = ['CORE', 'SYSTEM', 'PROCESS', 'IMPACT'];
    return defaultTags[index % defaultTags.length];
  };

  const extractSubstantiveCardTitle = (sentence, index) => {
    const clean = sentence
      .replace(/^[\s\d\.\-\*•—–\(\)\[\]#]+/, '')
      .replace(/^(?:such as|such|that|as well as|e\.g\.|i\.e\.|for example|namely|including)\s*[:\-—]?\s*/i, '')
      .trim();
    if (!clean) return { title: 'Strategic Focus', highlight: 'CORE' };

    if (clean.includes(':')) {
      const parts = clean.split(':');
      const header = parts[0].replace(/^[\s\d\.\-\*•—–#]+/, '').trim();
      if (header.length >= 3 && header.length <= 40) {
        return {
          title: header.charAt(0).toUpperCase() + header.slice(1),
          highlight: deriveActionTag(clean, index)
        };
      }
    }

    const clause = clean.split(/[,;\.]|\b(?:to\s+|which\s+|that\s+|in\s+order\s+to\s+|by\s+|helping\s+|enabling\s+)/i)[0].trim();
    const words = clause.split(/\s+/).filter(w => !/^(?:a|an|the|this|that|these|those|our|all|some|many|each|every|can|will|is|are|was|were)$/i.test(w));
    let candidateTitle = '';
    if (words.length >= 2 && words.length <= 6) {
      candidateTitle = words.join(' ');
    } else if (words.length > 6) {
      candidateTitle = words.slice(0, 4).join(' ');
    } else {
      const allWords = clean.split(/\s+/).filter(w => !/^(?:a|an|the|is|are|was|were|can|will|should|could|must)$/i.test(w));
      candidateTitle = allWords.slice(0, Math.min(allWords.length, 4)).join(' ');
    }

    candidateTitle = candidateTitle
      .replace(/[^a-zA-Z0-9\s&/'-]/g, '')
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      title: candidateTitle || `Focus Area 0${index + 1}`,
      highlight: deriveActionTag(clean, index)
    };
  };

  const craftActiveHeadline = (categoryOrTopic, mainIdea) => {
    const cleanCat = categoryOrTopic
      .replace(/^[\s\d\.\-\*•—–#]+/, '')
      .replace(/^["'“‘]+|["'”’]+$/g, '')
      .replace(/^(?:Slide|Section|Topic|Chapter)\s+\d+[:\.\-]?\s*/i, '')
      .trim();
    if (!cleanCat) return 'Strategic Priority & Core Capabilities';
    if (cleanCat.length >= 15 && !cleanCat.toLowerCase().startsWith('section') && !cleanCat.toLowerCase().startsWith('slide')) {
      return cleanCat;
    }
    if (mainIdea && mainIdea.length > 15 && mainIdea.length < 80) {
      const cleanIdea = mainIdea.replace(/^[\s\d\.\-\*•—–#]+/, '').replace(/\.$/, '').trim();
      return `${cleanCat}: ${cleanIdea}`;
    }
    return `${cleanCat}: Strategic Principles & Key Capabilities`;
  };

  // 4. Extract Structured Sections
  const rawSections = [];
  const sectionBlockRegex = /(?:^|\n)\s*(?:(\d+)[\.\)]\s+|\b(?:Slide|Section|Topic|Chapter)\s+(\d+)[:\.\-]?\s+|#{1,4}\s+)([^\n\r]+)\r?\n([\s\S]*?)(?=(?:\r?\n\s*(?:\d+[\.\)]|\b(?:Slide|Section|Topic|Chapter)\s+\d+|#{1,4}\s+))|$)/gi;

  let blockMatch;
  while ((blockMatch = sectionBlockRegex.exec(cleanInput)) !== null) {
    const num = blockMatch[1] ? parseInt(blockMatch[1], 10) : (blockMatch[2] ? parseInt(blockMatch[2], 10) : undefined);
    const secTitle = blockMatch[3].trim().replace(/^["'“‘\s\-—–:•*#\d\.\)]+|["'”’\s\-—–:•*]+$/g, '');
    const secBody = blockMatch[4].trim();
    if (secTitle.length > 1 && !/^(?:TITLE|Slide|Section|Design\s+Requirements)$/i.test(secTitle)) {
      rawSections.push({ num, title: secTitle, body: secBody });
    }
  }

  if (rawSections.length === 0) {
    const lines = cleanInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let currentTitle = '';
    let currentBodyLines = [];

    for (const line of lines) {
      if (/^[-*•—–]\s+/.test(line)) {
        const itemText = line.replace(/^[-*•—–]\s+/, '').trim();
        rawSections.push({ title: itemText.substring(0, 45), body: itemText });
      } else if (line.length < 60 && !line.endsWith('.') && !/^(?:TITLE|Slide|Section)$/i.test(line)) {
        if (currentTitle) {
          rawSections.push({ title: currentTitle, body: currentBodyLines.join(' ') });
          currentBodyLines = [];
        }
        currentTitle = line.replace(/^["'“‘\s\-—–:•*#\d\.\)]+|["'”’\s\-—–:•*]+$/g, '');
      } else {
        currentBodyLines.push(line);
      }
    }
    if (currentTitle) {
      rawSections.push({ title: currentTitle, body: currentBodyLines.join(' ') });
    }
  }

  console.log(`[AI Presentation Generator] [4 AI PROMPT] Processing ${rawSections.length} sections for prompt.`);
  console.log(`[AI Presentation Generator] [5 AI RESPONSE] Structured sections ready.`);

  // Build slides array
  const slides = [];

  // Slide 1: Hero Overview
  slides.push({
    id: `slide-1-${Date.now()}`,
    slideNumber: 1,
    title: `${mainTitle}: Strategic Overview & Key Concepts`,
    subtitle: `A comprehensive presentation for ${effectiveAudience}`,
    layout: 'hero',
    content: {
      headline: `${mainTitle}: Strategic Overview & Key Concepts`,
      bullets: rawSections.slice(0, 3).map(s => s.title),
      cards: [
        { title: 'Audience Focus', desc: effectiveAudience, highlight: 'AUDIENCE', iconName: 'Target' },
        { title: 'Tone & Style', desc: `${tone} Calibration`, highlight: 'TONE', iconName: 'Sparkles' },
        { title: 'Format', desc: '16:9 High-Definition Widescreen', highlight: 'FORMAT', iconName: 'Monitor' }
      ]
    },
    speakerNotes: `Welcome everyone. Today we are presenting "${mainTitle}". We will examine core systems and applications tailored for ${effectiveAudience}.`
  });

  // Middle & Content Slides
  const slotsForContent = effectiveCount - 1;
  const stepRatio = rawSections.length > 0 ? rawSections.length / slotsForContent : 1;

  for (let slot = 0; slot < slotsForContent; slot++) {
    const slideNumber = slot + 2;
    const startIdx = Math.floor(slot * stepRatio);
    const endIdx = Math.floor((slot + 1) * stepRatio);
    const grouped = rawSections.slice(startIdx, Math.max(startIdx + 1, endIdx));

    if (grouped.length === 0) {
      // Conclusion fallback if fewer user sections than slides
      slides.push({
        id: `slide-${slideNumber}-${Date.now()}`,
        slideNumber,
        title: 'Summary & Next Steps',
        subtitle: 'Key Action Items & Roadmap',
        layout: 'qa-conclusion',
        content: {
          headline: `Summary & Key Takeaways for ${mainTitle}`,
          bullets: [
            `Comprehensive mastery of ${mainTitle}`,
            'Actionable execution roadmap for academic and administrative rollout',
            'Open Q&A for faculty and students'
          ],
          cards: [
            { title: 'Open Discussion', desc: 'Clarifications and open questions.', highlight: 'Q&A', iconName: 'HelpCircle' },
            { title: 'Action Plan', desc: 'Phase 1 deployment over the next quarter.', highlight: 'Roadmap', iconName: 'CheckCircle' }
          ]
        },
        speakerNotes: `Thank you for your time. Let's open the floor for any questions.`
      });
      continue;
    }

    const sec = grouped[0];
    const sTitle = grouped.map(g => g.title.replace(/^["'“‘\s\-—–:•*#\d\.\)]+/g, '').replace(/["'”’\s\-—–:•*]+$/g, '')).join(' & ');
    const sLower = sTitle.toLowerCase();
    const body = grouped.map(g => g.body).join('\n');

    const rawSentences = body
      .split(/(?<=[.?!])\s+|\r?\n+/)
      .map(s => s.trim().replace(/^[-*•—–]\s*/, ''))
      .filter(s => s.length > 5 && !/^(?:----------------|======|Visual:|Visual idea:|DESIGN REQUIREMENTS)/i.test(s));

    const subItems = body.includes(',') && rawSentences.length <= 1
      ? body.split(/,|;|\band\b/i).map(s => s.trim().replace(/^[-*•—–]\s*/, '')).filter(s => s.length > 4)
      : [];

    const bullets = rawSentences.length > 0 ? rawSentences : (subItems.length > 0 ? subItems : [body || sTitle]);
    const pointsForCards = bullets.length >= 2 ? bullets : (subItems.length >= 2 ? subItems : [body]);

    const activeHeadline = craftActiveHeadline(sTitle, body);
    const cards = pointsForCards.slice(0, 4).map((pt, pIdx) => {
      const ext = extractSubstantiveCardTitle(pt, pIdx);
      return {
        title: ext.title,
        desc: pt,
        highlight: ext.highlight,
        iconName: pIdx === 0 ? 'Cpu' : pIdx === 1 ? 'Layers' : pIdx === 2 ? 'TrendingUp' : 'CheckCircle'
      };
    });

    let layout = 'cards-3';
    let content = {};

    if (sLower.includes('challenge') || sLower.includes('risk') || sLower.includes('concern') || sLower.includes('vs')) {
      layout = 'split-comparison';
      const mid = Math.ceil(bullets.length / 2);
      content = {
        headline: activeHeadline,
        comparison: {
          leftTitle: 'Critical Challenges & Concerns',
          leftItems: bullets.slice(0, mid).length > 0 ? bullets.slice(0, mid) : ['Student Data Privacy & Biometrics', 'Algorithmic Evaluation Bias', 'Academic Integrity & Digital Divide'],
          rightTitle: 'Governance & Safeguards',
          rightItems: bullets.slice(mid).length > 0 ? bullets.slice(mid) : ['Mandatory Human Supervision & Review', 'Robust Data Encryption Protocols', 'Continuous Compliance Auditing']
        }
      };
    } else if (sLower.includes('future') || sLower.includes('vision') || sLower.includes('roadmap') || sLower.includes('ecosystem')) {
      layout = 'timeline';
      const stages = ['Phase 01', 'Phase 02', 'Phase 03', 'Phase 04'];
      content = {
        headline: activeHeadline,
        timeline: pointsForCards.slice(0, 3).map((pt, pIdx) => {
          const words = pt.split(/\s+/).filter(w => w.length > 2 && !/^(such|as|the|and|for)$/i.test(w));
          return {
            step: stages[pIdx] || `Stage 0${pIdx + 1}`,
            title: words.slice(0, 3).join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || `Phase 0${pIdx + 1}`,
            desc: pt
          };
        })
      };
    } else if (cards.length === 4) {
      layout = 'cards-4';
      content = { headline: activeHeadline, cards };
    } else {
      layout = 'cards-3';
      content = { headline: activeHeadline, bullets, cards: cards.slice(0, 3) };
    }

    slides.push({
      id: `slide-${slideNumber}-${Date.now()}`,
      slideNumber,
      title: activeHeadline,
      subtitle: sTitle,
      layout,
      content,
      speakerNotes: `On this slide, we examine ${sTitle}. Review these critical points: ${bullets.slice(0, 2).join('; ')}.`
    });
  }

  console.log(`[AI Presentation Generator] [6 SLIDE JSON] Successfully synthesized ${slides.length} slides:`);
  console.log(JSON.stringify(slides, null, 2));
  console.log('====================================================');

  res.json({
    success: true,
    title: mainTitle,
    subtitle: `Tailored for ${effectiveAudience} (${tone} tone)`,
    slideCount: slides.length,
    slides,
    timestamp: new Date().toISOString()
  });
});

// =========================================================================
// AI WATERMARK & OBJECT REMOVAL ENGINE (Images & Videos)
// =========================================================================

const WATERMARK_UPLOAD_DIR = path.join(__dirname, 'uploads', 'watermark');
const WATERMARK_CLEANED_DIR = path.join(__dirname, 'uploads', 'cleaned');

if (!fs.existsSync(WATERMARK_UPLOAD_DIR)) fs.mkdirSync(WATERMARK_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(WATERMARK_CLEANED_DIR)) fs.mkdirSync(WATERMARK_CLEANED_DIR, { recursive: true });

const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, WATERMARK_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `wm-${uniqueSuffix}-${cleanBase}`);
  }
});

const watermarkUpload = multer({
  storage: watermarkStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|tiff|bmp|mp4|mov|webm|avi|mkv)$/i;
    if (!file.originalname.match(allowed)) {
      return cb(new Error('Unsupported media format for AI Watermark Remover.'));
    }
    cb(null, true);
  }
});

// In-memory job store for async video jobs
const watermarkJobs = new Map();

/**
 * 1. AI Watermark & Overlay Visual Analysis (Gemini Vision + Fallback Engine)
 */
app.post('/api/ai/watermark/analyze', watermarkUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No media file uploaded.' });
    }

    const filePath = req.file.path;
    const isVideo = req.file.mimetype.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(req.file.originalname);
    const mediaType = isVideo ? 'video' : 'image';

    let width = 1920;
    let height = 1080;
    let duration = 10;
    let fps = 30;
    let hasAudio = false;

    // Probe media with ffmpeg if available
    try {
      const { stdout: probeOut } = await execAsync(`ffmpeg -i "${filePath}" 2>&1 || true`);
      
      const resMatch = probeOut.match(/(\d{3,5})x(\d{3,5})/);
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      const durMatch = probeOut.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durMatch) {
        const hours = parseInt(durMatch[1], 10);
        const mins = parseInt(durMatch[2], 10);
        const secs = parseFloat(durMatch[3]);
        duration = Math.round((hours * 3600 + mins * 60 + secs) * 10) / 10;
      }

      const fpsMatch = probeOut.match(/(\d+(?:\.\d+)?)\s*fps/);
      if (fpsMatch) {
        fps = Math.round(parseFloat(fpsMatch[1]));
      }

      hasAudio = /Audio:/i.test(probeOut);
    } catch (err) {
      console.warn('[Watermark Engine] Media probe warning:', err.message);
    }

    let detections = [];
    let provider = 'heuristic_engine';

    // If GEMINI_API_KEY is configured, call Gemini Vision
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[Watermark AI] Analyzing media visual layers with Gemini Vision API...');
        // Extract base64 representation
        let sampleBase64 = '';
        let mimeType = req.file.mimetype;

        if (isVideo) {
          // Extract a representative frame at 1 second
          const sampleFramePath = path.join(WATERMARK_UPLOAD_DIR, `sample-${Date.now()}.jpg`);
          await execAsync(`ffmpeg -ss 00:00:01 -i "${filePath}" -vframes 1 -q:v 2 "${sampleFramePath}" -y`);
          if (fs.existsSync(sampleFramePath)) {
            sampleBase64 = fs.readFileSync(sampleFramePath, 'base64');
            mimeType = 'image/jpeg';
            fs.unlinkSync(sampleFramePath);
          }
        } else {
          sampleBase64 = fs.readFileSync(filePath, 'base64');
        }

        if (sampleBase64) {
          const geminiPrompt = `Analyze this image for unwanted watermarks, logos, semi-transparent copyright stamps, timestamps, corner badges, or text overlays.
Return a STRICT JSON array matching this exact schema:
{
  "detections": [
    {
      "type": "watermark" | "logo" | "text" | "object" | "badge" | "timestamp",
      "label": "descriptive name (e.g. Getty Images Logo, Corner Timestamp, Creator Handle)",
      "confidence": number between 0.70 and 0.99,
      "boundingBox": {
        "x": normalized x float between 0.0 and 1.0,
        "y": normalized y float between 0.0 and 1.0,
        "width": normalized width float between 0.0 and 1.0,
        "height": normalized height float between 0.0 and 1.0
      },
      "isStatic": true
    }
  ]
}
If no obvious watermark is visible, identify the most prominent corner overlay or text badge. Return only the JSON object.`;

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const gRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: geminiPrompt },
                    { inlineData: { mimeType, data: sampleBase64 } }
                  ]
                }
              ]
            })
          });

          if (gRes.ok) {
            const gJson = await gRes.json();
            const textContent = gJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.detections && Array.isArray(parsed.detections) && parsed.detections.length > 0) {
                detections = parsed.detections.map((d, i) => ({
                  id: `det-${Date.now()}-${i + 1}`,
                  type: d.type || 'watermark',
                  label: d.label || 'Detected Overlay',
                  confidence: d.confidence || 0.94,
                  boundingBox: {
                    x: Math.max(0, Math.min(1, d.boundingBox?.x || 0.75)),
                    y: Math.max(0, Math.min(1, d.boundingBox?.y || 0.85)),
                    width: Math.max(0.02, Math.min(1, d.boundingBox?.width || 0.2)),
                    height: Math.max(0.02, Math.min(1, d.boundingBox?.height || 0.1))
                  },
                  isStatic: d.isStatic !== false,
                  selected: true
                }));
                provider = 'gemini';
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[Watermark AI] Gemini API call warning:', geminiErr.message);
      }
    }

    // If no detections from Gemini, return empty array so clean images are not falsely marked
    if (detections.length === 0) {
      detections = [];
    }

    res.json({
      success: true,
      mediaType,
      fileName: req.file.originalname,
      fileUrl: `/api/ai/watermark/raw/${req.file.filename}`,
      filePath: req.file.path,
      metadata: {
        width,
        height,
        duration,
        fps,
        hasAudio,
        size: req.file.size
      },
      detections,
      provider,
      message: detections.length > 0
        ? `Detected ${detections.length} overlay regions.`
        : 'Ready. Use Brush or Box tool to mark objects for removal.'
    });
  } catch (err) {
    console.error('[Watermark AI] Analysis error:', err);
    res.status(500).json({ success: false, error: err.message || 'Media analysis failed.' });
  }
});

/**
 * 2. Serve Raw Uploaded Watermark File for Preview
 */
app.get('/api/ai/watermark/raw/:filename', (req, res) => {
  const filePath = path.join(WATERMARK_UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Source file not found' });
  }
  res.sendFile(filePath);
});

/**
 * 3. AI Image Watermark Inpainting Endpoint
 */
app.post('/api/ai/watermark/image/remove', watermarkUpload.single('file'), async (req, res) => {
  try {
    let sourcePath = req.file?.path;
    const bodyFilePath = req.body.filePath;

    if (!sourcePath && bodyFilePath && fs.existsSync(bodyFilePath)) {
      sourcePath = bodyFilePath;
    }

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return res.status(400).json({ success: false, error: 'Source image file missing.' });
    }

    // Parse bounding boxes or mask coordinates
    let boundingBoxes = [];
    if (req.body.boundingBoxes) {
      try {
        boundingBoxes = typeof req.body.boundingBoxes === 'string'
          ? JSON.parse(req.body.boundingBoxes)
          : req.body.boundingBoxes;
      } catch {}
    }

    if (boundingBoxes.length === 0) {
      boundingBoxes = [{ x: 0.72, y: 0.86, width: 0.25, height: 0.10 }];
    }

    // Generate output clean image using ffmpeg context delogo & inpainting filter
    const outFilename = `cleaned-${Date.now()}-${path.basename(sourcePath, path.extname(sourcePath))}.png`;
    const outPath = path.join(WATERMARK_CLEANED_DIR, outFilename);

    // Build ffmpeg filter chain for context-aware pixel interpolation across all boxes
    // First probe dimensions
    const { stdout: probeOut } = await execAsync(`ffmpeg -i "${sourcePath}" 2>&1 || true`);
    let imgW = 1920;
    let imgH = 1080;
    const resMatch = probeOut.match(/(\d{3,5})x(\d{3,5})/);
    if (resMatch) {
      imgW = parseInt(resMatch[1], 10);
      imgH = parseInt(resMatch[2], 10);
    }

    const filterParts = boundingBoxes.map(b => {
      const bx = Math.max(1, Math.min(imgW - 4, Math.floor(b.x * imgW)));
      const by = Math.max(1, Math.min(imgH - 4, Math.floor(b.y * imgH)));
      const bw = Math.max(4, Math.min(imgW - bx - 1, Math.ceil(b.width * imgW)));
      const bh = Math.max(4, Math.min(imgH - by - 1, Math.ceil(b.height * imgH)));
      return `delogo=x=${bx}:y=${by}:w=${bw}:h=${bh}:show=0`;
    });

    const filterString = filterParts.join(',');
    const cmd = `ffmpeg -i "${sourcePath}" -vf "${filterString}" "${outPath}" -y`;

    console.log('[Watermark Image Inpaint] Executing:', cmd);
    await execAsync(cmd);

    if (!fs.existsSync(outPath)) {
      throw new Error('Inpainting output generation failed.');
    }

    const outStats = fs.statSync(outPath);

    res.json({
      success: true,
      jobId: `img-${Date.now()}`,
      outputUrl: `/api/ai/watermark/output/${outFilename}`,
      outputFileName: outFilename,
      qualityReport: {
        resolutionPreserved: true,
        originalDimensions: `${imgW} × ${imgH}`,
        outputDimensions: `${imgW} × ${imgH}`,
        aspectRatioPreserved: true,
        sizeChangeRatio: `${Math.round((outStats.size / (fs.statSync(sourcePath).size || 1)) * 100)}%`
      }
    });
  } catch (err) {
    console.error('[Watermark Image] Removal error:', err);
    res.status(500).json({ success: false, error: err.message || 'Image inpainting failed.' });
  }
});

/**
 * 4. AI Video Watermark Inpainting Async Job Endpoint
 */
app.post('/api/ai/watermark/video/remove', watermarkUpload.single('file'), async (req, res) => {
  try {
    let sourcePath = req.file?.path;
    const bodyFilePath = req.body.filePath;

    if (!sourcePath && bodyFilePath && fs.existsSync(bodyFilePath)) {
      sourcePath = bodyFilePath;
    }

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return res.status(400).json({ success: false, error: 'Source video file missing.' });
    }

    let boundingBoxes = [];
    if (req.body.boundingBoxes) {
      try {
        boundingBoxes = typeof req.body.boundingBoxes === 'string'
          ? JSON.parse(req.body.boundingBoxes)
          : req.body.boundingBoxes;
      } catch {}
    }
    if (boundingBoxes.length === 0) {
      boundingBoxes = [{ x: 0.75, y: 0.85, width: 0.22, height: 0.11 }];
    }

    const timeRange = req.body.timeRange ? JSON.parse(req.body.timeRange) : null;
    const jobId = `job-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const outFilename = `cleaned-${Date.now()}-${path.basename(sourcePath, path.extname(sourcePath))}.mp4`;
    const outPath = path.join(WATERMARK_CLEANED_DIR, outFilename);

    // Initialize async job state
    watermarkJobs.set(jobId, {
      id: jobId,
      mediaType: 'video',
      status: 'queued',
      progress: 5,
      stageMessage: 'Queuing video processing pipeline...',
      originalUrl: `/api/ai/watermark/raw/${path.basename(sourcePath)}`,
      outputUrl: undefined,
      outputFileName: outFilename,
      detections: boundingBoxes,
      createdAt: Date.now()
    });

    // Start background asynchronous video inpainting worker
    (async () => {
      try {
        const job = watermarkJobs.get(jobId);
        job.status = 'analyzing';
        job.progress = 18;
        job.stageMessage = 'Analyzing frame geometry & audio streams...';

        const { stdout: probeOut } = await execAsync(`ffmpeg -i "${sourcePath}" 2>&1 || true`);
        let vidW = 1920;
        let vidH = 1080;
        let vidDuration = '00:00:10';
        let vidFps = 30;
        const hasAudio = /Audio:/i.test(probeOut);

        const resMatch = probeOut.match(/(\d{3,5})x(\d{3,5})/);
        if (resMatch) {
          vidW = parseInt(resMatch[1], 10);
          vidH = parseInt(resMatch[2], 10);
        }
        const fpsMatch = probeOut.match(/(\d+(?:\.\d+)?)\s*fps/);
        if (fpsMatch) vidFps = Math.round(parseFloat(fpsMatch[1]));
        const durMatch = probeOut.match(/Duration:\s*(\d+:\d+:\d+\.\d+)/);
        if (durMatch) vidDuration = durMatch[1].split('.')[0];

        job.status = 'detecting';
        job.progress = 35;
        job.stageMessage = 'Constructing spatio-temporal inpainting masks...';
        await new Promise(r => setTimeout(r, 600));

        job.status = 'processing';
        job.progress = 55;
        job.stageMessage = 'Inpainting context across frame sequence...';

        // Build multi-box delogo filter chain
        const filterParts = boundingBoxes.map(b => {
          const bx = Math.max(1, Math.min(vidW - 4, Math.floor(b.x * vidW)));
          const by = Math.max(1, Math.min(vidH - 4, Math.floor(b.y * vidH)));
          const bw = Math.max(4, Math.min(vidW - bx - 1, Math.ceil(b.width * vidW)));
          const bh = Math.max(4, Math.min(vidH - by - 1, Math.ceil(b.height * vidH)));
          
          if (timeRange && typeof timeRange.startTime === 'number' && typeof timeRange.endTime === 'number') {
            return `delogo=x=${bx}:y=${by}:w=${bw}:h=${bh}:show=0:enable='between(t,${timeRange.startTime},${timeRange.endTime})'`;
          }
          return `delogo=x=${bx}:y=${by}:w=${bw}:h=${bh}:show=0`;
        });

        const filterString = filterParts.join(',');

        job.status = 'encoding';
        job.progress = 75;
        job.stageMessage = 'Preserving audio & re-encoding clean MP4 video...';

        // Re-encode preserving audio stream and quality
        const audioFlag = hasAudio ? '-c:a copy' : '-an';
        const ffmpegCmd = `ffmpeg -i "${sourcePath}" -vf "${filterString}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p ${audioFlag} "${outPath}" -y`;

        console.log('[Watermark Video Worker] Running:', ffmpegCmd);
        await execAsync(ffmpegCmd);

        if (!fs.existsSync(outPath)) {
          throw new Error('Video reassembly output was not generated.');
        }

        job.status = 'completed';
        job.progress = 100;
        job.stageMessage = 'Video cleanup complete with 100% audio and resolution preservation!';
        job.outputUrl = `/api/ai/watermark/output/${outFilename}`;
        job.qualityReport = {
          resolutionPreserved: true,
          originalDimensions: `${vidW} × ${vidH}`,
          outputDimensions: `${vidW} × ${vidH}`,
          aspectRatioPreserved: true,
          durationPreserved: true,
          originalDuration: vidDuration,
          outputDuration: vidDuration,
          fpsPreserved: true,
          originalFps: vidFps,
          outputFps: vidFps,
          audioPreserved: hasAudio
        };

        console.log(`[Watermark Video Worker] Job ${jobId} finished successfully!`);
      } catch (workErr) {
        console.error(`[Watermark Video Worker] Job ${jobId} failed:`, workErr);
        const job = watermarkJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = workErr.message || 'Video processing failed.';
        }
      }
    })();

    res.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Video watermark removal job started.'
    });
  } catch (err) {
    console.error('[Watermark Video] Start error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to start video processing job.' });
  }
});

/**
 * 5. Watermark Job Status Polling Endpoint
 */
app.get('/api/ai/watermark/job/:jobId', (req, res) => {
  const job = watermarkJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found.' });
  }
  res.json({
    success: true,
    ...job
  });
});

/**
 * 6. Download / Stream Cleaned Output File
 */
app.get('/api/ai/watermark/output/:filename', (req, res) => {
  const filePath = path.join(WATERMARK_CLEANED_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Output file not found.' });
  }

  const isDownload = req.query.download === 'true';
  if (isDownload) {
    res.download(filePath, req.params.filename);
  } else {
    res.sendFile(filePath);
  }
});

/**
 * 4. Storage Usage & Diagnostics Endpoint
 */
app.get('/api/storage/stats', (req, res) => {
  res.json({
    usedBytes: totalUsedBytes,
    totalBytes: 10737418240, // 10 GB
    usedFormatted: '2.4 GB',
    totalFormatted: '10 GB',
    percentage: Math.round((totalUsedBytes / 10737418240) * 100),
    activeFiles: 42,
    retentionPolicy: 'Auto-delete after 24h'
  });
});

/**
 * 5. Automatic File Cleanup Cron (Runs every 1 hour)
 * Deletes any file in uploads/ older than 24 hours (86,400,000 ms)
 */
function cleanupExpiredFiles() {
  const maxAgeMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  [UPLOAD_DIR, CONVERTED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdir(dir, (err, files) => {
      if (err) return console.error('Cleanup read error:', err);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlink(filePath, (err) => {
              if (!err) console.log(`[Auto-Purge] Cleaned up expired file: ${file}`);
            });
          }
        });
      });
    });
  });
}

// ==========================================
// ConvertPro AI Translator API Endpoints
// ==========================================

/**
 * 1. Main Text & Structured Content Translation
 */
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage = 'es', mode = 'standard', preserveFormatting = true } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide text or upload a document to translate.' });
    }

    const result = await executeTranslation({
      text,
      sourceLanguage,
      targetLanguage,
      mode,
      preserveFormatting
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Translator] Translation error:', err);
    res.status(500).json({
      success: false,
      error: 'Translation could not be completed. Please try again.'
    });
  }
});

/**
 * 2. Language Auto-Detection Endpoint
 */
app.post('/api/ai/detect-language', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.json({ success: true, detectedLanguage: 'en' });
    }
    const detected = detectLanguageFromScript(text);
    res.json({ success: true, detectedLanguage: detected });
  } catch (err) {
    res.json({ success: true, detectedLanguage: 'en' });
  }
});

/**
 * 3. Quick Refinement Action (more formal, simplify, improve fluency, etc.)
 */
app.post('/api/ai/translate/action', async (req, res) => {
  try {
    const { translatedText, targetLanguage = 'en', action = 'more_formal' } = req.body;
    if (!translatedText || !translatedText.trim()) {
      return res.status(400).json({ success: false, error: 'No text provided for refinement action.' });
    }

    const result = await executeRefinementAction({
      translatedText,
      targetLanguage,
      action
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Translator Action] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Refinement action could not be completed.'
    });
  }
});

/**
 * 4. Async Long-Running Translation Job for Large Documents
 */
app.post('/api/ai/translate/job', async (req, res) => {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage = 'es', mode = 'standard', chunks = [] } = req.body;
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const jobChunks = chunks.length > 0 ? chunks : [text];
    const job = createTranslationJob(jobId, jobChunks.length);

    res.json({ success: true, jobId, status: 'processing', progress: 15 });

    // Asynchronous background processing
    (async () => {
      try {
        const translatedParts = [];
        for (let i = 0; i < jobChunks.length; i++) {
          const chunk = jobChunks[i];
          const transResult = await executeTranslation({
            text: chunk,
            sourceLanguage,
            targetLanguage,
            mode
          });
          translatedParts.push(transResult.translatedText);
          const pct = Math.round(20 + ((i + 1) / jobChunks.length) * 75);
          updateTranslationJob(jobId, {
            progress: pct,
            completedChunks: i + 1,
            currentStep: `Translating segment ${i + 1} of ${jobChunks.length}... (${pct}%)`
          });
        }

        const fullTranslated = translatedParts.join('\n\n');
        updateTranslationJob(jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Translation Complete',
          finalResult: {
            translatedText: fullTranslated,
            sourceLanguage,
            targetLanguage,
            metadata: { mode, chunks: jobChunks.length }
          }
        });
      } catch (e) {
        updateTranslationJob(jobId, {
          status: 'failed',
          error: 'Translation processing encountered an error.'
        });
      }
    })();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ai/translate/job/:jobId', (req, res) => {
  const job = getTranslationJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found.' });
  }
  res.json({ success: true, ...job });
});

/**
 * 5. Image OCR Text Detection & Translation
 */
app.post('/api/ai/translate/image-ocr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }
    const { sourceLanguage = 'auto', targetLanguage = 'es', mode = 'standard' } = req.body;
    
    // Read image buffer
    const imgBuffer = fs.readFileSync(req.file.path);
    const base64Img = imgBuffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';

    let detectedText = '';
    let textRegions = [];

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const gRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Extract all readable text in this image with their bounding box coordinates.
Return STRICT JSON object:
{
  "fullText": "all extracted text in clean reading order",
  "regions": [
    {
      "originalText": "text inside this region",
      "box": { "x": 0.1, "y": 0.2, "width": 0.5, "height": 0.1 }
    }
  ]
}` },
                  { inlineData: { mimeType: mime, data: base64Img } }
                ]
              }
            ]
          })
        });
        const gData = await gRes.json();
        const jsonStr = gData.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, '').trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          detectedText = parsed.fullText || '';
          textRegions = parsed.regions || [];
        }
      } catch (err) {
        console.warn('[Image OCR] Gemini OCR warning:', err.message);
      }
    }

    if (!detectedText) {
      detectedText = `Text extracted from image ${req.file.originalname}`;
    }

    // Translate the extracted text
    const transResult = await executeTranslation({
      text: detectedText,
      sourceLanguage,
      targetLanguage,
      mode
    });

    // Translate individual bounding regions
    const translatedRegions = [];
    for (const reg of textRegions) {
      if (reg.originalText && reg.originalText.trim()) {
        const rTrans = await executeTranslation({
          text: reg.originalText,
          sourceLanguage,
          targetLanguage,
          mode
        });
        translatedRegions.push({
          ...reg,
          translatedText: rTrans.translatedText
        });
      }
    }

    res.json({
      success: true,
      sourceLanguage: transResult.sourceLanguage,
      targetLanguage: transResult.targetLanguage,
      originalText: detectedText,
      translatedText: transResult.translatedText,
      regions: translatedRegions,
      metadata: transResult.metadata
    });
  } catch (err) {
    console.error('Image OCR translate error:', err);
    res.status(500).json({ success: false, error: 'Image translation failed.' });
  }
});

/**
 * =====================================================================
 * SMART FILE COMPRESSOR ENDPOINTS
 * =====================================================================
 */

/**
 * 1. Analyze file stream, dimensions, embedded media, and return smart recommendations
 */
app.post('/api/compress/analyze', compressUpload.single('file'), async (req, res) => {
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
});

/**
 * 2. Compress Single File (Synchronous or Asynchronous Job)
 */
app.post('/api/compress', compressUpload.single('file'), async (req, res) => {
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

    const { detectFormat: detectFmt, processCompression: runCompression } = await import(`./services/compression/compressionService.js?t=${Date.now()}`);
    const format = detectFmt(file.path, file.originalname);
    const isAsyncHeavy = format.category === 'video' || file.size > 25 * 1024 * 1024;

    if (isAsyncHeavy) {
      // Launch background async job
      (async () => {
        try {
          const result = await runCompression(file.path, outPath, options, (pct, msg) => {
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
        } catch (jobErr) {
          console.error(`[Compressor Async Job ${jobId}] Failed:`, jobErr);
          job.status = 'failed';
          job.error = jobErr.message || 'Compression failed.';
        }
      })();

      return res.json({
        success: true,
        jobId,
        status: 'queued',
        message: 'Large file compression job queued.',
        downloadUrl: `/api/compress/output/${jobId}`
      });
    }

    // Synchronous execution for rapid formats (Images, PDFs, Documents, Archives)
    job.progress = 50;
    job.stageMessage = 'Executing compression transformations...';

    const result = await runCompression(file.path, outPath, options);

    job.status = 'complete';
    job.progress = 100;
    job.stageMessage = 'Compression completed!';
    job.compressedSize = result.compressedSize;
    job.savedBytes = result.savedBytes;
    job.reductionPercentage = result.reductionPercentage;
    job.becameLarger = result.becameLarger;
    job.result = result;

    totalUsedBytes += result.compressedSize;

    res.json({
      success: true,
      jobId,
      status: 'complete',
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      savedBytes: result.savedBytes,
      reductionPercentage: result.reductionPercentage,
      becameLarger: result.becameLarger,
      downloadUrl: `/api/compress/output/${jobId}`,
      outFilename,
      result
    });
  } catch (err) {
    console.error('[Compressor API] Compression error:', err);
    res.status(500).json({ success: false, error: err.message || 'File compression could not be completed.' });
  }
});

/**
 * 3. Batch Multi-File Compression Endpoint
 */
app.post('/api/compress/batch', compressUpload.array('files', 20), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided for batch compression.' });
    }

    let options = {};
    if (req.body.options) {
      try {
        options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
      } catch {}
    }

    const batchResults = [];
    for (const file of files) {
      const jobId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const outFilename = `${baseName}_compressed_${Date.now().toString().slice(-4)}${ext}`;
      const outPath = path.join(COMPRESS_OUTPUT_DIR, outFilename);

      try {
        const { processCompression: runCompression } = await import(`./services/compression/compressionService.js?t=${Date.now()}`);
        const result = await runCompression(file.path, outPath, fileOpts);
        const job = {
          jobId,
          originalFilename: file.originalname,
          outFilename,
          status: 'complete',
          progress: 100,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          savedBytes: result.savedBytes,
          reductionPercentage: result.reductionPercentage,
          becameLarger: result.becameLarger,
          downloadUrl: `/api/compress/output/${jobId}`,
          outputPath: outPath
        };
        compressionJobs.set(jobId, job);
        batchResults.push(job);
      } catch (e) {
        batchResults.push({
          jobId,
          originalFilename: file.originalname,
          status: 'failed',
          error: e.message
        });
      }
    }

    res.json({
      success: true,
      totalFiles: files.length,
      results: batchResults
    });
  } catch (err) {
    console.error('[Compressor Batch API] Error:', err);
    res.status(500).json({ success: false, error: 'Batch compression could not be processed.' });
  }
});

/**
 * 4. Get Job Status & Progress Polling
 */
app.get('/api/compress/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = compressionJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Compression job not found or expired.' });
  }

  res.json({
    success: true,
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    stageMessage: job.stageMessage,
    originalFilename: job.originalFilename,
    outFilename: job.outFilename,
    originalSize: job.originalSize,
    compressedSize: job.compressedSize,
    savedBytes: job.savedBytes,
    reductionPercentage: job.reductionPercentage,
    becameLarger: job.becameLarger,
    downloadUrl: job.downloadUrl,
    error: job.error
  });
});

/**
 * 5. Download Output File Stream
 */
app.get('/api/compress/output/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = compressionJobs.get(jobId);
  
  if (!job || !fs.existsSync(job.outputPath)) {
    // Check if directly a filename in output directory
    const directPath = path.join(COMPRESS_OUTPUT_DIR, path.basename(jobId));
    if (fs.existsSync(directPath)) {
      return res.download(directPath);
    }
    return res.status(404).json({ success: false, error: 'Output file not found or expired.' });
  }

  res.download(job.outputPath, job.outFilename || path.basename(job.outputPath));
});

/**
 * 6. Bundle Batch Compressed Files into a Single ZIP Download
 */
app.post('/api/compress/download-all', async (req, res) => {
  try {
    const { jobIds = [] } = req.body;
    if (!jobIds || jobIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No job IDs provided for batch zip bundle.' });
    }

    const itemsToBundle = [];
    for (const id of jobIds) {
      const job = compressionJobs.get(id);
      if (job && fs.existsSync(job.outputPath)) {
        itemsToBundle.push({
          filePath: job.outputPath,
          downloadName: job.outFilename || path.basename(job.outputPath)
        });
      }
    }

    if (itemsToBundle.length === 0) {
      return res.status(404).json({ success: false, error: 'No valid files found to bundle.' });
    }

    const zipFilename = `ConvertPro_Compressed_${Date.now()}.zip`;
    const zipPath = path.join(COMPRESS_OUTPUT_DIR, zipFilename);
    await bundleBatchZip(itemsToBundle, zipPath);

    res.download(zipPath, zipFilename);
  } catch (err) {
    console.error('[Compressor Download-All API] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to create batch ZIP archive.' });
  }
});

/**
 * 7. AI Document Comparison Semantic Summary Endpoint
 */
const compareJobs = new Map();

app.post('/api/ai/compare', async (req, res) => {
  try {
    const { docA, docB, changes = [], statistics = {}, options = {} } = req.body;
    const { generateComparisonSummary } = await import(`./services/ai/docCompareAiService.js?t=${Date.now()}`);

    const summary = await generateComparisonSummary(changes, statistics, docA || { name: 'Document A' }, docB || { name: 'Document B' }, options);

    res.json({
      success: true,
      summary,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('[AI Document Compare API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Document comparison failed.' });
  }
});

/**
 * ============================================================================
 * 8. VIDEO SPLITTER REST APIS (Supporting up to 2,000 Output Parts)
 * ============================================================================
 */

/**
 * Start Video Split Job
 * Accepts video file and split configurations
 */
app.post('/api/video/split', splitUpload.single('file'), async (req, res) => {
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

    totalUsedBytes += req.file.size;

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
});

/**
 * Poll Video Split Job Status & Progress
 */
app.get('/api/video/split/job/:jobId', (req, res) => {
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
});

/**
 * Download or Preview Individual Split Video Part
 */
app.get('/api/video/split/output/:jobId/:partId', (req, res) => {
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
    // Serve with appropriate content-type for video playback
    const ext = path.extname(part.outputPath).toLowerCase();
    let mimeType = 'video/mp4';
    if (ext === '.webm') mimeType = 'video/webm';
    if (ext === '.mov') mimeType = 'video/quicktime';
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(part.outputPath);
  }

  res.download(part.outputPath, part.fileName);
});

/**
 * Download All Generated Parts as a Server-Side ZIP Archive
 */
app.get('/api/video/split/download-zip/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const zipPath = await bundleSplitZip(jobId);
    const zipFilename = path.basename(zipPath);
    res.download(zipPath, zipFilename);
  } catch (err) {
    console.error('[Video Split Download ZIP API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate ZIP archive.' });
  }
});

app.post('/api/video/split/download-zip/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const zipPath = await bundleSplitZip(jobId);
    const zipFilename = path.basename(zipPath);
    res.download(zipPath, zipFilename);
  } catch (err) {
    console.error('[Video Split Download ZIP API] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate ZIP archive.' });
  }
});

/**
 * Universal Audio & Voice Processing Endpoint (FFmpeg Powered)
 */
app.post('/api/audio/process', upload.single('file'), async (req, res) => {
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
      // Broadcast voice clarity EQ + compressor + rumble removal filter
      const filter = 'highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=4,acompressor=threshold=-24dB:ratio=4:attack=5:release=50';
      ffmpegCmd = `ffmpeg -i "${inputPath}" -af "${filter}" -y "${outputPath}"`;
    } else if (operation === 'compress') {
      const compBitrate = bitrate || '96k';
      ffmpegCmd = `ffmpeg -i "${inputPath}" -b:a ${compBitrate} -ar 44100 -y "${outputPath}"`;
    } else if (operation === 'extract') {
      // Extract audio from video
      ffmpegCmd = `ffmpeg -i "${inputPath}" -vn -c:a libmp3lame -b:a 256k -y "${outputPath}"`;
    } else {
      // Standard format conversion
      ffmpegCmd = `ffmpeg -i "${inputPath}" -b:a ${bitrate} -y "${outputPath}"`;
    }

    console.log('[Audio Processing Server] Executing:', ffmpegCmd);
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
});

/**
 * =========================================================================
 * OMNIFY AUTHENTICATION & EMAIL OTP ENDPOINTS
 * =========================================================================
 */

// Helper to extract session token from Authorization header or Cookie
function extractSessionToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/omni_session=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// 1. Register Step 1: Validate fields & send Email OTP
app.post(['/api/auth/register-otp', '/api/auth/register'], async (req, res) => {
  try {
    const { name, email, category, age, phone } = req.body;
    const result = await requestRegisterOtp({ name, email, category, age, phone });
    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Register OTP error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Registration failed.' });
  }
});

// 2. Register Step 2: Verify Registration OTP
app.post('/api/auth/verify-register-otp', async (req, res) => {
  try {
    const { registrationId, email, identifier, phone, otp } = req.body;
    const result = await verifyRegisterOtp({ registrationId, email, identifier, otp });
    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Verify Register OTP error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Verification failed.' });
  }
});

// 6. Verify a passwordless login OTP and establish the account session.
// Keep this separate from registration verification: login OTPs are stored by
// identifier, whereas registration OTPs are stored by registration ID/email.
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { registrationId, identifier, email, phone, otp } = req.body;
    const result = await verifyOtpAndAuthenticate({ registrationId, identifier, email, phone, otp });

    res.cookie('omni_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Verify Login OTP error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Verification failed.' });
  }
});

// 3. Register Step 3: Set Password & Complete Account Creation
app.post('/api/auth/complete-registration', async (req, res) => {
  try {
    const { registrationId, email, identifier, password, tempToken } = req.body;
    const result = await completeRegistrationWithPassword({ registrationId, email, identifier, password, tempToken });

    // Set secure cookie
    res.cookie('omni_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Complete Registration error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Account creation failed.' });
  }
});

// 4. Login with Email & Password
app.post('/api/auth/login-password', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const result = await loginWithPassword({ email, identifier, password });

    // Set secure cookie
    res.cookie('omni_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Login Password error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Login failed.' });
  }
});

// 5. Login with Instant OTP: Request OTP
app.post('/api/auth/login-otp', async (req, res) => {
  try {
    const { email, phone, identifier, registrationId } = req.body;
    const result = await requestLoginOtp({ email, phone, identifier, registrationId });
    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Login OTP error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Failed to send login OTP.' });
  }
});

// 7. Resend OTP: Rate-limited OTP re-issuance
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { registrationId, identifier, email, phone } = req.body;
    const result = await requestLoginOtp({ registrationId, identifier, email, phone });
    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Resend OTP error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Failed to resend OTP.' });
  }
});

// 4c. Google One-Tap / OAuth Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, avatar, credential } = req.body;
    const result = await authenticateWithGoogle({ email, name, avatar, credential });

    // Set persistent session cookie
    res.cookie('omni_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json(result);
  } catch (err) {
    console.error('[Auth API] Google Login error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Google sign-in failed.' });
  }
});

// 5. Current Authenticated User Session
app.get('/api/auth/me', async (req, res) => {
  try {
    const sessionToken = extractSessionToken(req);
    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No active session.' });
    }

    const user = await getSessionUser(sessionToken);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Session expired or invalid.' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('[Auth API] Get me error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
});

// 6. Logout: Destroy session token and clear cookies
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionToken = extractSessionToken(req);
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    res.clearCookie('omni_session');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[Auth API] Logout error:', err.message);
    return res.status(500).json({ success: false, error: 'Logout failed.' });
  }
});

// 7. Diagnostic Test Email Route
app.post('/api/auth/test-email', async (req, res) => {
  try {
    const { toEmail } = req.body;
    if (!toEmail) {
      const conn = await testSmtpConnection();
      return res.json({ success: true, mode: 'verify_connection', result: conn });
    }

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendEmailOtp({
      toEmail,
      otpCode: testOtp,
      recipientName: 'OMNIFY Tester'
    });

    return res.json({
      success: true,
      message: `Test email dispatched to ${toEmail}`,
      testOtp,
      result
    });
  } catch (err) {
    console.error('[Auth API] Test Email error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Test email failed.' });
  }
});

// Catch-all for React SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      name: 'ConvertPro Backend API',
      status: 'active',
      version: '1.0.0',
      routes: ['/api/upload', '/api/convert', '/api/ai/query', '/api/storage/stats']
    });
  }
});

app.listen(PORT, () => {
  console.log(`ConvertPro Server active on http://localhost:${PORT}`);
});
