import { Router } from 'express';

import * as pf from '../controllers/pf.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { remindersQueryValidator } from '../validators/pf.validator';

// Rappels unifiés de l'utilisatrice (planification familiale, CPN, vaccins).
const router = Router();

router.get('/', requireAuth(), remindersQueryValidator, validate, pf.myReminders);

export default router;
