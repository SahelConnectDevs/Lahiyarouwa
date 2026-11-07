import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { objectIdParam } from '../validators/common';
import { createContractionSessionValidator } from '../validators/sante.validator';

const router = Router();
router.use(requireAuth());

router.get('/', sante.listContractions);
router.post('/', createContractionSessionValidator, validate, sante.createContractionSession);
router.delete('/:id', objectIdParam(), validate, sante.deleteContractionSession);

export default router;
