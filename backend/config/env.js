import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

export const PORT = process.env.PORT || 4000;
export const IS_VERCEL = Boolean(process.env.VERCEL);
export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || 'omnify_stateless_crypto_token_secret_key_2026';

// Storage directories
export const BASE_STORAGE_DIR = IS_VERCEL ? os.tmpdir() : ROOT_DIR;
export const UPLOAD_DIR = path.join(BASE_STORAGE_DIR, 'uploads');
export const CONVERTED_DIR = path.join(BASE_STORAGE_DIR, 'converted');
export const COMPRESS_UPLOAD_DIR = path.join(UPLOAD_DIR, 'compress');
export const COMPRESS_OUTPUT_DIR = path.join(CONVERTED_DIR, 'compress');
export const SPLIT_UPLOAD_DIR = path.join(UPLOAD_DIR, 'splits');
export const SPLIT_OUTPUT_DIR = path.join(CONVERTED_DIR, 'splits');
export const WATERMARK_UPLOAD_DIR = path.join(UPLOAD_DIR, 'watermark');
export const WATERMARK_OUTPUT_DIR = path.join(CONVERTED_DIR, 'watermark');
export const QR_STORAGE_DIR = path.join(UPLOAD_DIR, 'qr');
export const AUTH_DATA_DIR = path.join(UPLOAD_DIR, 'auth');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Ensure directories exist
export function initStorageDirectories() {
  const dirs = [
    UPLOAD_DIR,
    CONVERTED_DIR,
    COMPRESS_UPLOAD_DIR,
    COMPRESS_OUTPUT_DIR,
    SPLIT_UPLOAD_DIR,
    SPLIT_OUTPUT_DIR,
    WATERMARK_UPLOAD_DIR,
    WATERMARK_OUTPUT_DIR,
    QR_STORAGE_DIR,
    AUTH_DATA_DIR
  ];

  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn(`[Env] Failed to create directory ${dir}:`, e.message);
    }
  });
}
