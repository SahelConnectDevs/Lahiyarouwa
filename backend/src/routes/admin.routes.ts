import { Router, type RequestHandler } from 'express';

import * as admin from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { conseilAdmin, cpnStepAdmin, methodeAdmin, vaccinAdmin } from '../services/conseil.service';
import type { ContentService } from '../services/content.service';
import {
  conseilListValidator,
  conseilValidator,
  createUserValidator,
  cpnStepValidator,
  listAlertsValidator,
  listUsersValidator,
  updateAlertValidator,
  updateUserValidator,
  vaccinListValidator,
  vaccinValidator,
} from '../validators/admin.validator';
import { objectIdParam, paginationQuery } from '../validators/common';
import { methodListValidator, methodValidator } from '../validators/pf.validator';

// API du back-office (admin-web) : tout est réservé au rôle admin.
const router = Router();
router.use(requireAuth(), requireRole('admin'));

router.get('/stats', admin.stats);

router.get('/users', listUsersValidator, validate, admin.listUsers);
router.post('/users', createUserValidator, validate, admin.createUser);
router.get('/relais', admin.listAgents);
router.get('/users/:id', objectIdParam(), validate, admin.getUser);
router.patch('/users/:id', objectIdParam(), updateUserValidator, validate, admin.updateUser);
router.delete('/users/:id', objectIdParam(), validate, admin.deleteUser);
// Mot de passe oublié : renvoie un mot de passe provisoire, affiché une fois.
router.post('/users/:id/reset-password', objectIdParam(), validate, admin.resetPassword);

router.get('/alertes', listAlertsValidator, validate, admin.listAlerts);
router.patch('/alertes/:id', objectIdParam(), updateAlertValidator, validate, admin.updateAlert);

/** Monte GET/POST /<path> et GET/PATCH/DELETE /<path>/:id pour un contenu éditable. */
function mountContent<T>(
  path: string,
  service: ContentService<T>,
  validators: { list: RequestHandler[]; body: (partial: boolean) => RequestHandler[] },
): void {
  const handlers = admin.contentHandlers(service);
  router.get(`/${path}`, ...validators.list, validate, handlers.list);
  router.post(`/${path}`, ...validators.body(false), validate, handlers.create);
  router.get(`/${path}/:id`, objectIdParam(), validate, handlers.get);
  router.patch(`/${path}/:id`, objectIdParam(), ...validators.body(true), validate, handlers.update);
  router.delete(`/${path}/:id`, objectIdParam(), validate, handlers.remove);
}

mountContent('conseils', conseilAdmin, { list: conseilListValidator, body: conseilValidator });
mountContent('vaccins', vaccinAdmin, { list: vaccinListValidator, body: vaccinValidator });
mountContent('cpn-etapes', cpnStepAdmin, { list: paginationQuery, body: cpnStepValidator });
mountContent('methodes-pf', methodeAdmin, { list: methodListValidator, body: methodValidator });

export default router;
