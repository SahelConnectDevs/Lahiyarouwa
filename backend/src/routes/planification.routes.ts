import { Router } from 'express';

import * as pf from '../controllers/pf.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  methodCodeParam,
  renewValidator,
  startMethodValidator,
  stopValidator,
  updateMethodValidator,
} from '../validators/pf.validator';

const router = Router();

// Catalogue public : l'information sur les méthodes doit être accessible
// sans compte (séquence « Information » du parcours).
router.get('/methodes', pf.listMethods);
router.get('/methodes/:code', methodCodeParam, validate, pf.getMethod);

// Méthode suivie par l'utilisatrice connectée.
router.get('/ma-methode', requireAuth(), pf.getMyMethod);
router.post('/ma-methode', requireAuth(), startMethodValidator, validate, pf.startMethod);
router.patch('/ma-methode', requireAuth(), updateMethodValidator, validate, pf.updateMyMethod);
router.post('/ma-methode/renouvellement', requireAuth(), renewValidator, validate, pf.renewMethod);
router.post('/ma-methode/arret', requireAuth(), stopValidator, validate, pf.stopMethod);
router.get('/historique', requireAuth(), pf.methodHistory);

export default router;
