import { Router } from 'express';
import {
  handleAnalyzeCompression,
  handleCompressSingle,
  handleCompressBatch,
  handleGetCompressionJob,
  handleGetCompressionOutput,
  handleDownloadAllCompression
} from '../controllers/compressionController.js';
import { compressUpload } from '../../middleware/uploadMiddleware.js';

const router = Router();

router.post('/compress/analyze', compressUpload.single('file'), handleAnalyzeCompression);
router.post('/compress', compressUpload.single('file'), handleCompressSingle);
router.post('/compress/batch', compressUpload.array('files', 20), handleCompressBatch);
router.get('/compress/job/:jobId', handleGetCompressionJob);
router.get('/compress/output/:jobId', handleGetCompressionOutput);
router.post('/compress/download-all', handleDownloadAllCompression);

export default router;
