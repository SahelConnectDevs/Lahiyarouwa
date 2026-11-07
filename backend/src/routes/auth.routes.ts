import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import * as pfController from '../controllers/pf.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { loginRateLimit, registerRateLimit } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  changePasswordValidator,
  deleteAccountValidator,
  loginValidator,
  registerValidator,
  updateProfileValidator,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', registerRateLimit, registerValidator, validate, authController.register);
router.post('/login', loginRateLimit, loginValidator, validate, authController.login);

router.get('/me', requireAuth(), authController.me);
router.patch('/me', requireAuth(), updateProfileValidator, validate, authController.updateMe);
// Agent communautaire de l'utilisatrice (nom, téléphone) pour pouvoir le joindre.
router.get('/me/agent', requireAuth(), pfController.myAgent);
// Ces deux routes vérifient le mot de passe : même anti brute-force que /login.
router.post(
  '/me/password',
  requireAuth(),
  loginRateLimit,
  changePasswordValidator,
  validate,
  authController.changePassword,
);
// Suppression du compte et de toutes ses données (exigence Google Play).
router.delete(
  '/me',
  requireAuth(),
  loginRateLimit,
  deleteAccountValidator,
  validate,
  authController.deleteMe,
);

export default router;
