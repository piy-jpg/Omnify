import multer from 'multer';
import {
  UPLOAD_DIR,
  COMPRESS_UPLOAD_DIR,
  SPLIT_UPLOAD_DIR,
  WATERMARK_UPLOAD_DIR,
  QR_STORAGE_DIR
} from '../config/env.js';
import { ALLOWED_EXTENSIONS_REGEX } from '../config/constants.js';

function createStorage(dir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });
}

// Standard file upload
export const upload = multer({
  storage: createStorage(UPLOAD_DIR),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(ALLOWED_EXTENSIONS_REGEX)) {
      return cb(new Error('Unsupported file format. Please upload supported document, data, image, or media files.'));
    }
    cb(null, true);
  }
});

// QR file sharing upload
export const qrUpload = multer({
  storage: createStorage(QR_STORAGE_DIR),
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Watermark remover upload
export const watermarkUpload = multer({
  storage: createStorage(WATERMARK_UPLOAD_DIR),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// Compression upload
export const compressUpload = multer({
  storage: createStorage(COMPRESS_UPLOAD_DIR),
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Video split upload
export const splitUpload = multer({
  storage: createStorage(SPLIT_UPLOAD_DIR),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB
});
