import { Router } from 'express';
import {
  uploadDocument,
  uploadMultiple,
  analyzeDocument,
  getDocument,
  getHistory,
  deleteDocument,
  runOcrOnDocument,
  exportReport,
  getProcessingStatus,
} from '../controllers/document.controller.js';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

router.post('/upload', uploadLimiter, upload.single('file'), uploadDocument);
router.post('/upload/multiple', uploadLimiter, upload.array('files', 10), uploadMultiple);
router.post('/analyze/:id', analyzeDocument);
router.get('/history', getHistory);
router.get('/documents/:id', getDocument);
router.get('/documents/:id/status', getProcessingStatus);
router.get('/documents/:id/export', exportReport);
router.post('/documents/:id/ocr', runOcrOnDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
