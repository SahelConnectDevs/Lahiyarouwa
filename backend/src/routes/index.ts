import { Router } from 'express';

import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

// Monte ici les routes des autres features au fur et à mesure (grossesse,
// enfant, vaccination, nutrition, planning_familial, relais, alertes,
// assistant_ia), sur le même modèle que auth.routes.ts : un router dédié,
// des validators express-validator, un controller fin qui délègue à un
// service, requireAuth()/requireRole() pour protéger ce qui doit l'être.

export default router;
