import { Router } from 'express';
import { semanticDocumentSearch, searchValidation } from '../controllers/search.controller.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/', searchValidation, validate, semanticDocumentSearch);

export default router;
