import { Router } from 'express';
import { chatWithDocument, chatValidation } from '../controllers/chat.controller.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/', chatValidation, validate, chatWithDocument);

export default router;
