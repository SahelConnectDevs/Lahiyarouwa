import { Router } from 'express';

import adminRoutes from './admin.routes';
import alerteRoutes from './alerte.routes';
import authRoutes from './auth.routes';
import conseilRoutes from './conseil.routes';
import contractionRoutes from './contraction.routes';
import enfantRoutes from './enfant.routes';
import grossesseRoutes from './grossesse.routes';
import planificationRoutes from './planification.routes';
import rappelRoutes from './rappel.routes';
import relaisRoutes from './relais.routes';
import { vaccinationRoutes, vaccinRoutes } from './vaccination.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/grossesse', grossesseRoutes);
router.use('/enfants', enfantRoutes);
router.use('/vaccins', vaccinRoutes);
router.use('/vaccinations', vaccinationRoutes);
router.use('/contractions', contractionRoutes);
router.use('/alertes', alerteRoutes);
router.use('/conseils', conseilRoutes);
router.use('/planification', planificationRoutes);
router.use('/rappels', rappelRoutes);
router.use('/relais', relaisRoutes);
router.use('/admin', adminRoutes);

// Restent à brancher sur le même modèle (un router dédié, des validators,
// un controller fin, un service) : nutrition, assistant_ia, messages vocaux
// et serveur vocal (SVI).

export default router;
