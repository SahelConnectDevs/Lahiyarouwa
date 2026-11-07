import { Router } from 'express';

import * as sante from '../controllers/sante.controller';
import { validate } from '../middlewares/validate.middleware';
import { listConseilsValidator } from '../validators/sante.validator';

// Public : les conseils publiés sont du contenu éditorial, lisible sans
// compte (écrans avant connexion, futur site...).
const router = Router();

router.get('/', listConseilsValidator, validate, sante.listConseils);

export default router;
