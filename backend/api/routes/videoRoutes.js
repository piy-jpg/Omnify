import { Router } from 'express';
import {
  handleStartVideoSplit,
  handleGetVideoSplitJob,
  handleGetVideoSplitOutput,
  handleDownloadVideoSplitZip
} from '../controllers/videoController.js';
import { splitUpload } from '../../middleware/uploadMiddleware.js';

const router = Router();

router.post('/video/split', splitUpload.single('file'), handleStartVideoSplit);
router.get('/video/split/diag', async (req, res) => {
  try {
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    const os = (await import('os')).default;
    const { getFfmpegPath, ensureFfmpegPath } = await import('../../config/ffmpeg.js');

    function scan(dir, depth = 0) {
      if (depth > 3 || !fs.existsSync(dir)) return [];
      try {
        const items = fs.readdirSync(dir);
        return items.flatMap(i => {
          const full = path.join(dir, i);
          try {
            if (fs.statSync(full).isDirectory()) return [full, ...scan(full, depth + 1)];
            return [full];
          } catch (_) { return [full]; }
        });
      } catch (_) { return []; }
    }

    res.json({
      cwd: process.cwd(),
      tmp: fs.existsSync('/tmp') ? fs.readdirSync('/tmp') : [],
      ffmpegPath: getFfmpegPath(),
      taskFiles: scan('/var/task', 0).slice(0, 100),
      cwdFiles: scan(process.cwd(), 0).slice(0, 100)
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});
router.get('/video/split/job/:jobId', handleGetVideoSplitJob);
router.get('/video/split/output/:jobId/:partId', handleGetVideoSplitOutput);
router.get('/video/split/download-zip/:jobId', handleDownloadVideoSplitZip);
router.post('/video/split/download-zip/:jobId', handleDownloadVideoSplitZip);

router.get('/video/test-ffmpeg', async (req, res) => {
  try {
    const fs = (await import('fs')).default;
    const os = (await import('os')).default;
    const { getFfmpegPath, ensureFfmpegPath, execFfmpegCommand } = await import('../../config/ffmpeg.js');
    
    const initialPath = getFfmpegPath();
    const resolvedPath = await ensureFfmpegPath();
    const ver = await execFfmpegCommand('-version');

    res.json({
      success: true,
      initialPath,
      resolvedPath,
      ffmpegVersion: ver.stdout.split('\n')[0],
      tmpFiles: fs.existsSync('/tmp') ? fs.readdirSync('/tmp') : [],
      arch: os.arch(),
      platform: os.platform()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

export default router;
