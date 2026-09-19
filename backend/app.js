import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { DIST_DIR, initStorageDirectories } from './config/env.js';
import apiRouter from './api/routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Initialize storage directories
initStorageDirectories();

const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Diagnostic test endpoint before static files
app.use(async (req, res, next) => {
  if (req.url.includes('test-ffmpeg') || req.path.includes('test-ffmpeg')) {
    try {
      const os = await import('os');
      const { getFfmpegPath, ensureFfmpegPath, execFfmpegCommand } = await import('./config/ffmpeg.js');
      
      const diagnostics = {
        reqUrl: req.url,
        reqPath: req.path,
        platform: os.platform(),
        arch: os.arch(),
        cwd: process.cwd(),
        tmpFiles: fs.existsSync('/tmp') ? fs.readdirSync('/tmp') : [],
        hasNodeModules: fs.existsSync('node_modules'),
        hasFfmpegInstaller: fs.existsSync('node_modules/@ffmpeg-installer'),
        hasFfmpegStatic: fs.existsSync('node_modules/ffmpeg-static'),
        getFfmpegPath: getFfmpegPath(),
        ensureFfmpegPath: null,
        ffmpegVersion: null,
        error: null
      };

      try {
        diagnostics.ensureFfmpegPath = await ensureFfmpegPath();
        const ver = await execFfmpegCommand('-version');
        diagnostics.ffmpegVersion = ver.stdout.split('\n')[0];
      } catch (e) {
        diagnostics.error = e.message;
        diagnostics.stack = e.stack;
      }

      return res.json(diagnostics);
    } catch (err) {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
  }
  next();
});

// Serve static frontend build if dist directory exists
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// Diagnostics endpoint to test ffmpeg and environment on Vercel
app.get(['/api/test-ffmpeg', '/test-ffmpeg'], async (req, res) => {
  try {
    const os = await import('os');
    const { getFfmpegPath, ensureFfmpegPath, execFfmpegCommand } = await import('./config/ffmpeg.js');
    
    const diagnostics = {
      platform: os.platform(),
      arch: os.arch(),
      cwd: process.cwd(),
      tmpFiles: fs.existsSync('/tmp') ? fs.readdirSync('/tmp') : [],
      hasNodeModules: fs.existsSync('node_modules'),
      hasFfmpegInstaller: fs.existsSync('node_modules/@ffmpeg-installer'),
      hasFfmpegStatic: fs.existsSync('node_modules/ffmpeg-static'),
      getFfmpegPath: getFfmpegPath(),
      ensureFfmpegPath: null,
      ffmpegVersion: null,
      error: null
    };

    try {
      diagnostics.ensureFfmpegPath = await ensureFfmpegPath();
      const ver = await execFfmpegCommand('-version');
      diagnostics.ffmpegVersion = ver.stdout.split('\n')[0];
    } catch (e) {
      diagnostics.error = e.message;
      diagnostics.stack = e.stack;
    }

    res.json(diagnostics);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Mount central API router under /api and root
app.use('/api', apiRouter);
app.use(apiRouter);

// SPA client-side fallback / Health endpoint
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      name: 'Omnify Backend API',
      status: 'active',
      version: '1.0.0',
      routes: [
        '/api/auth/*',
        '/api/upload',
        '/api/convert',
        '/api/compress/*',
        '/api/video/*',
        '/api/audio/*',
        '/api/ai/*',
        '/api/qr/*',
        '/api/storage/stats'
      ]
    });
  }
});

// Central Error Handler
app.use(errorHandler);

export default app;
