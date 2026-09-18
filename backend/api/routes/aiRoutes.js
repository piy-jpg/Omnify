import { Router } from 'express';
import {
  handleAiQuery,
  handleAiWrite,
  handleAiWriteEdit,
  handleGeneratePresentation,
  handleWatermarkAnalyze,
  handleWatermarkRaw,
  handleWatermarkImageRemove,
  handleWatermarkVideoRemove,
  handleWatermarkJob,
  handleWatermarkOutput,
  handleAiTranslate,
  handleDetectLanguage,
  handleTranslateAction,
  handleTranslateJob,
  handleGetTranslateJob,
  handleTranslateImageOcr,
  handleAiCompare
} from '../controllers/aiController.js';
import { watermarkUpload, upload } from '../../middleware/uploadMiddleware.js';

const router = Router();

// AI Assistant & Writer
router.post('/ai/query', handleAiQuery);
router.post('/ai/write', handleAiWrite);
router.post('/ai/write/edit', handleAiWriteEdit);
router.post('/ai/generate-presentation', handleGeneratePresentation);

// AI Watermark Removal
router.post('/ai/watermark/analyze', watermarkUpload.single('file'), handleWatermarkAnalyze);
router.get('/ai/watermark/raw/:filename', handleWatermarkRaw);
router.post('/ai/watermark/image/remove', watermarkUpload.single('file'), handleWatermarkImageRemove);
router.post('/ai/watermark/video/remove', watermarkUpload.single('file'), handleWatermarkVideoRemove);
router.get('/ai/watermark/job/:jobId', handleWatermarkJob);
router.get('/ai/watermark/output/:filename', handleWatermarkOutput);

// AI Translation
router.post('/ai/translate', handleAiTranslate);
router.post('/ai/detect-language', handleDetectLanguage);
router.post('/ai/translate/action', handleTranslateAction);
router.post('/ai/translate/job', handleTranslateJob);
router.get('/ai/translate/job/:jobId', handleGetTranslateJob);
router.post('/ai/translate/image-ocr', upload.single('file'), handleTranslateImageOcr);

// AI Comparison
router.post('/ai/compare', handleAiCompare);

export default router;
