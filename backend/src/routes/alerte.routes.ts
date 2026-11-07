import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAlertValidator } from '../validators/sante.validator';

const router = Router();
router.use(requireAuth());

router.get('/', sante.listAlertes);
router.post('/', createAlertValidator, validate, sante.createAlerte);

export default router;
