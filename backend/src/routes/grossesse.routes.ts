import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ddrValidator, finishPregnancyValidator, markCpnValidator } from '../validators/sante.validator';

const router = Router();
router.use(requireAuth());

router.get('/', sante.getGrossesse);
router.put('/', ddrValidator, validate, sante.putGrossesse);
router.post('/terminer', finishPregnancyValidator, validate, sante.terminerGrossesse);
router.get('/cpn', sante.listCpn);
router.put('/cpn/:numero', markCpnValidator, validate, sante.markCpn);

export default router;
