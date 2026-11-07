import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { objectIdParam } from '../validators/common';
import { createChildValidator, updateChildValidator } from '../validators/sante.validator';

const router = Router();
router.use(requireAuth());

router.get('/', sante.listEnfants);
router.post('/', createChildValidator, validate, sante.createEnfant);
router.get('/:id', objectIdParam(), validate, sante.getEnfant);
router.patch('/:id', objectIdParam(), updateChildValidator, validate, sante.updateEnfant);
router.delete('/:id', objectIdParam(), validate, sante.deleteEnfant);

export default router;
