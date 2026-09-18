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
router.get('/video/split/job/:jobId', handleGetVideoSplitJob);
router.get('/video/split/output/:jobId/:partId', handleGetVideoSplitOutput);
router.get('/video/split/download-zip/:jobId', handleDownloadVideoSplitZip);
router.post('/video/split/download-zip/:jobId', handleDownloadVideoSplitZip);

export default router;
