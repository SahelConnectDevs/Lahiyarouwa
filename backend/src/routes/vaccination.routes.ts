import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { objectIdParam } from '../validators/common';
import {
  createVaccinationValidator,
  enfantQueryValidator,
  vaccineQueryValidator,
} from '../validators/sante.validator';

/** /vaccins : calendrier vaccinal (contenu). */
export const vaccinRoutes = Router();
vaccinRoutes.use(requireAuth());
vaccinRoutes.get('/', vaccineQueryValidator, validate, sante.listVaccins);

/** /vaccinations : doses reçues par la maman (sans ?enfant=) ou par un enfant (?enfant=<id>). */
export const vaccinationRoutes = Router();
vaccinationRoutes.use(requireAuth());
vaccinationRoutes.get('/', enfantQueryValidator, validate, sante.listVaccinations);
vaccinationRoutes.get('/calendrier', enfantQueryValidator, validate, sante.calendrierVaccinal);
vaccinationRoutes.post('/', createVaccinationValidator, validate, sante.createVaccination);
vaccinationRoutes.delete('/:id', objectIdParam(), validate, sante.deleteVaccination);
