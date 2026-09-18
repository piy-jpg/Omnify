import { Router } from 'express';
import {
  getNetworkInfo,
  handleQrUpload,
  handleGetQrFile,
  handleSaveRecord,
  handleGetShare,
  handleDeleteShare
} from '../controllers/qrController.js';
import { qrUpload } from '../../middleware/uploadMiddleware.js';

const router = Router();

router.get('/qr/network-info', getNetworkInfo);
router.post('/qr/upload', qrUpload.array('files', 15), handleQrUpload);
router.get('/qr/file/:fileId', handleGetQrFile);
router.post('/qr/record', handleSaveRecord);
router.post('/qr/share', handleSaveRecord);
router.get('/qr/share/:shareId', handleGetShare);
router.get('/qr/record/:shareId', handleGetShare);
router.delete('/qr/:shareId', handleDeleteShare);

export default router;
