import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import * as pfController from '../controllers/pf.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { loginCodeRateLimit, loginRateLimit, registerRateLimit } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  changePasswordValidator,
  deleteAccountValidator,
  loginValidator,
  registerValidator,
  resendLoginCodeValidator,
  updateProfileValidator,
  verifyLoginCodeValidator,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', registerRateLimit, registerValidator, validate, authController.register);
router.post('/login', loginRateLimit, loginValidator, validate, authController.login);
// Double authentification (admins) : /login renvoie { mfaRequired, challengeToken }
// après avoir envoyé un code par e-mail, échangé ici contre { token, user }.
router.post(
  '/login/verify',
  loginCodeRateLimit,
  verifyLoginCodeValidator,
  validate,
  authController.verifyLoginCode,
);
router.post(
  '/login/resend',
  loginCodeRateLimit,
  resendLoginCodeValidator,
  validate,
  authController.resendLoginCode,
);

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
