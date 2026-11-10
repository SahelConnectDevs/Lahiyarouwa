import type { Request, RequestHandler, Response } from 'express';

import type { AlertStatus } from '../models/Alert';
import type { Role } from '../models/User';
import * as adminService from '../services/admin.service';
import * as alerteService from '../services/alerte.service';
import type { ContentService } from '../services/content.service';
import { asyncHandler } from '../utils/asyncHandler';
import { readPagination } from '../utils/pagination';
import { bodyData, currentUserId, queryData, routeParam } from '../utils/request';

// --- Tableau de bord -------------------------------------------------------

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await adminService.stats());
});

// --- Utilisateurs ----------------------------------------------------------

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const filter = queryData<{
    search?: string;
    role?: Role;
    isActive?: boolean;
    relais?: string;
    sansAgent?: boolean;
  }>(req);
  res.status(200).json(await adminService.listUsers(filter, readPagination(req)));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminService.getUser(routeParam(req, 'id')));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.updateUser(
    currentUserId(req),
    routeParam(req, 'id'),
    bodyData<{ role?: Role; isActive?: boolean; relais?: string | null; secteur?: string | null }>(req),
  );
  res.status(200).json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.createUser(bodyData<Parameters<typeof adminService.createUser>[0]>(req));
  res.status(201).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await adminService.resetPassword(currentUserId(req), routeParam(req, 'id')));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(currentUserId(req), routeParam(req, 'id'));
  res.status(204).end();
});

export const listAgents = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await adminService.listAgents());
});

// --- Alertes ---------------------------------------------------------------

export const listAlerts = asyncHandler(async (req: Request, res: Response) => {
  const filter = queryData<{ statut?: AlertStatus }>(req);
  res.status(200).json(await alerteService.listAll(filter, readPagination(req)));
});

export const updateAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alerteService.updateStatus(
    routeParam(req, 'id'),
    currentUserId(req),
    bodyData<{ statut?: AlertStatus; noteSuivi?: string }>(req),
  );
  res.status(200).json(alert);
});

// --- Contenus (conseils, vaccins, étapes CPN) -------------------------------

/**
 * Handlers CRUD pour un contenu. Les filtres de liste sont les paramètres de
 * query validés (hors pagination), ex: ?categorie=nutrition.
 */
export function contentHandlers<T>(
  service: ContentService<T>,
): Record<'list' | 'get' | 'create' | 'update' | 'remove', RequestHandler> {
  return {
    list: asyncHandler(async (req, res) => {
      const filter = queryData<Record<string, unknown>>(req);
      delete filter.page;
      delete filter.limit;
      res.status(200).json(await service.list(filter, readPagination(req)));
    }),
    get: asyncHandler(async (req, res) => {
      res.status(200).json(await service.get(routeParam(req, 'id')));
    }),
    create: asyncHandler(async (req, res) => {
      res.status(201).json(await service.create(bodyData(req)));
    }),
    update: asyncHandler(async (req, res) => {
      res.status(200).json(await service.update(routeParam(req, 'id'), bodyData(req)));
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(routeParam(req, 'id'));
      res.status(204).end();
    }),
  };
}
