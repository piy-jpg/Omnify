import { Router } from 'express';
import { handleProcessAudio } from '../controllers/audioController.js';
import { upload } from '../../middleware/uploadMiddleware.js';

const router = Router();

router.post('/audio/process', upload.single('file'), handleProcessAudio);

export default router;
