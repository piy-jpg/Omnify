import { Router } from 'express';
import authRoutes from './authRoutes.js';
import conversionRoutes from './conversionRoutes.js';
import compressionRoutes from './compressionRoutes.js';
import videoRoutes from './videoRoutes.js';
import audioRoutes from './audioRoutes.js';
import qrRoutes from './qrRoutes.js';
import aiRoutes from './aiRoutes.js';
import storageRoutes from './storageRoutes.js';

const router = Router();

// Mount individual route modules
router.use('/auth', authRoutes);
router.use(conversionRoutes);
router.use(compressionRoutes);
router.use(videoRoutes);
router.use(audioRoutes);
router.use(qrRoutes);
router.use(aiRoutes);
router.use(storageRoutes);

export default router;
