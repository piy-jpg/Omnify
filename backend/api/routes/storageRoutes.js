import { Router } from 'express';
import { getStorageStats } from '../controllers/storageController.js';

const router = Router();

router.get('/storage/stats', getStorageStats);

export default router;
