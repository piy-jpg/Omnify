import { Router } from 'express';
import { handleFileUpload, handleConvert } from '../controllers/conversionController.js';
import { upload } from '../../middleware/uploadMiddleware.js';

const router = Router();

router.post('/upload', upload.single('file'), handleFileUpload);
router.post('/convert', handleConvert);

export default router;
