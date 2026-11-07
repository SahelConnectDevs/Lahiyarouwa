import { Router } from 'express';

import * as pf from '../controllers/pf.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateAlertValidator } from '../validators/admin.validator';
import { objectIdParam } from '../validators/common';
import {
  beneficiariesQueryValidator,
  followUpValidator,
  relaisAlertsQueryValidator,
} from '../validators/pf.validator';

// Espace de l'agent communautaire : réservé au rôle 'relais', et limité à
// ses propres bénéficiaires (voir services/relais.service.ts).
const router = Router();
router.use(requireAuth(), requireRole('relais'));

router.get('/tableau-de-bord', pf.relaisDashboard);
router.get('/beneficiaires', beneficiariesQueryValidator, validate, pf.relaisBeneficiaries);
router.get('/beneficiaires/:id', objectIdParam(), validate, pf.relaisBeneficiary);
router.get('/beneficiaires/:id/suivis', objectIdParam(), validate, pf.relaisFollowUps);
router.post('/beneficiaires/:id/suivis', objectIdParam(), followUpValidator, validate, pf.relaisAddFollowUp);
router.get('/alertes', relaisAlertsQueryValidator, validate, pf.relaisAlerts);
router.patch('/alertes/:id', objectIdParam(), updateAlertValidator, validate, pf.relaisUpdateAlert);

export default router;
