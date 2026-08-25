import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { loginRateLimit } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginValidator, registerValidator } from '../validators/auth.validator';

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginRateLimit, loginValidator, validate, authController.login);
router.get('/me', requireAuth(), authController.me);

export default router;
