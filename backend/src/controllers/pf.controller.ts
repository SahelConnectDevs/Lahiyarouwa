import type { Request, Response } from 'express';

import type { AlertStatus } from '../models/Alert';
import type { FollowUpType } from '../models/FollowUp';
import * as pfService from '../services/pf.service';
import * as rappelService from '../services/rappel.service';
import * as relaisService from '../services/relais.service';
import { asyncHandler } from '../utils/asyncHandler';
import { bodyData, currentUser, currentUserId, queryData, routeParam } from '../utils/request';

// --- Planification familiale -----------------------------------------------

export const listMethods = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await pfService.listMethods());
});

export const getMethod = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await pfService.getMethod(routeParam(req, 'code')));
});

/** 200 avec la méthode en cours et son prochain rappel, ou `null`. */
export const getMyMethod = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await pfService.getCurrent(currentUserId(req)));
});

export const startMethod = asyncHandler(async (req: Request, res: Response) => {
  const view = await pfService.start(
    currentUserId(req),
    bodyData<Parameters<typeof pfService.start>[1]>(req),
  );
  res.status(201).json(view);
});

export const updateMyMethod = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await pfService.update(currentUserId(req), bodyData(req)));
});

export const renewMethod = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await pfService.renew(currentUserId(req), bodyData<{ date: Date }>(req).date));
});

export const stopMethod = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json(await pfService.stop(currentUserId(req), bodyData<{ date: Date; raison?: string }>(req)));
});

export const methodHistory = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await pfService.history(currentUserId(req)));
});

// --- Rappels ---------------------------------------------------------------

export const myReminders = asyncHandler(async (req: Request, res: Response) => {
  const { horizon } = queryData<{ horizon?: number }>(req);
  res.status(200).json(await rappelService.upcoming(currentUserId(req), horizon));
});

/** Agent communautaire de l'utilisatrice connectée, ou `null`. */
export const myAgent = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await relaisService.myAgent(currentUser(req)));
});

// --- Espace agent communautaire --------------------------------------------

export const relaisDashboard = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await relaisService.dashboard(currentUserId(req)));
});

export const relaisBeneficiaries = asyncHandler(async (req: Request, res: Response) => {
  const { search } = queryData<{ search?: string }>(req);
  res.status(200).json(await relaisService.listBeneficiaries(currentUserId(req), search));
});

export const relaisBeneficiary = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await relaisService.getBeneficiary(currentUserId(req), routeParam(req, 'id')));
});

export const relaisAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { statut } = queryData<{ statut?: AlertStatus }>(req);
  res.status(200).json(await relaisService.listAlerts(currentUserId(req), statut));
});

export const relaisUpdateAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await relaisService.updateAlert(
    currentUserId(req),
    routeParam(req, 'id'),
    bodyData<{ statut?: AlertStatus; noteSuivi?: string }>(req),
  );
  res.status(200).json(alert);
});

export const relaisFollowUps = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await relaisService.listFollowUps(currentUserId(req), routeParam(req, 'id')));
});

export const relaisAddFollowUp = asyncHandler(async (req: Request, res: Response) => {
  const followUp = await relaisService.addFollowUp(
    currentUserId(req),
    routeParam(req, 'id'),
    bodyData<{ type: FollowUpType; date?: Date; note?: string; orienteVers?: string; alerte?: string }>(req),
  );
  res.status(201).json(followUp);
});
