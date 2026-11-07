import type { Request, Response } from 'express';

import type { AlertSign } from '../models/Alert';
import type { ConseilCategorie, Langue } from '../models/Conseil';
import * as alerteService from '../services/alerte.service';
import * as conseilService from '../services/conseil.service';
import * as contractionService from '../services/contraction.service';
import * as enfantService from '../services/enfant.service';
import * as grossesseService from '../services/grossesse.service';
import * as vaccinationService from '../services/vaccination.service';
import { asyncHandler } from '../utils/asyncHandler';
import { bodyData, currentUser, currentUserId, queryData, routeParam } from '../utils/request';

// Contrôleurs des données de santé de l'utilisatrice connectée. Chaque
// service filtre par currentUserId(req) : une utilisatrice ne peut jamais
// lire ni modifier les données d'une autre (404, pas 403, pour ne pas
// révéler qu'une ressource existe).

// --- Grossesse -------------------------------------------------------------

/** 200 avec la grossesse en cours, ou `null` s'il n'y en a pas (l'app affiche alors l'écran DDR). */
export const getGrossesse = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await grossesseService.getCurrent(currentUserId(req)));
});

export const putGrossesse = asyncHandler(async (req: Request, res: Response) => {
  const { ddr } = bodyData<{ ddr: Date }>(req);
  const { view, created } = await grossesseService.setDdr(currentUserId(req), ddr);
  res.status(created ? 201 : 200).json(view);
});

export const terminerGrossesse = asyncHandler(async (req: Request, res: Response) => {
  const { dateAccouchement } = bodyData<{ dateAccouchement: Date }>(req);
  res.status(200).json(await grossesseService.finish(currentUserId(req), dateAccouchement));
});

export const listCpn = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await grossesseService.listCpn(currentUserId(req)));
});

export const markCpn = asyncHandler(async (req: Request, res: Response) => {
  const view = await grossesseService.markCpn(
    currentUserId(req),
    Number(routeParam(req, 'numero')),
    bodyData<{ effectuee: boolean; date?: Date; notes?: string }>(req),
  );
  res.status(200).json(view);
});

// --- Enfants ---------------------------------------------------------------

export const listEnfants = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await enfantService.list(currentUserId(req)));
});

export const createEnfant = asyncHandler(async (req: Request, res: Response) => {
  const child = await enfantService.create(
    currentUserId(req),
    bodyData<Parameters<typeof enfantService.create>[1]>(req),
  );
  res.status(201).json(child);
});

export const getEnfant = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await enfantService.getOwned(currentUserId(req), routeParam(req, 'id')));
});

export const updateEnfant = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await enfantService.update(currentUserId(req), routeParam(req, 'id'), bodyData(req)));
});

export const deleteEnfant = asyncHandler(async (req: Request, res: Response) => {
  await enfantService.remove(currentUserId(req), routeParam(req, 'id'));
  res.status(204).end();
});

// --- Vaccination -----------------------------------------------------------

export const listVaccins = asyncHandler(async (req: Request, res: Response) => {
  const { cible } = queryData<{ cible?: vaccinationService.VaccineTarget }>(req);
  res.status(200).json(await vaccinationService.listVaccines(cible));
});

export const listVaccinations = asyncHandler(async (req: Request, res: Response) => {
  const { enfant } = queryData<{ enfant?: string }>(req);
  res.status(200).json(await vaccinationService.listRecords(currentUserId(req), enfant));
});

export const calendrierVaccinal = asyncHandler(async (req: Request, res: Response) => {
  const { enfant } = queryData<{ enfant?: string }>(req);
  res.status(200).json(await vaccinationService.calendar(currentUserId(req), enfant));
});

export const createVaccination = asyncHandler(async (req: Request, res: Response) => {
  const record = await vaccinationService.createRecord(
    currentUserId(req),
    bodyData<Parameters<typeof vaccinationService.createRecord>[1]>(req),
  );
  res.status(201).json(record);
});

export const deleteVaccination = asyncHandler(async (req: Request, res: Response) => {
  await vaccinationService.removeRecord(currentUserId(req), routeParam(req, 'id'));
  res.status(204).end();
});

// --- Contractions ----------------------------------------------------------

export const listContractions = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await contractionService.list(currentUserId(req)));
});

export const createContractionSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await contractionService.create(
    currentUserId(req),
    bodyData<contractionService.ContractionSessionInput>(req),
  );
  res.status(201).json(session);
});

export const deleteContractionSession = asyncHandler(async (req: Request, res: Response) => {
  await contractionService.remove(currentUserId(req), routeParam(req, 'id'));
  res.status(204).end();
});

// --- Alertes ---------------------------------------------------------------

export const listAlertes = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await alerteService.listMine(currentUserId(req)));
});

export const createAlerte = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alerteService.create(
    currentUser(req),
    bodyData<{ signe: AlertSign; details?: string }>(req),
  );
  res.status(201).json(alert);
});

// --- Conseils --------------------------------------------------------------

export const listConseils = asyncHandler(async (req: Request, res: Response) => {
  const filter = queryData<{ categorie?: ConseilCategorie; langue?: Langue; semaine?: number }>(req);
  res.status(200).json(await conseilService.listPublished(filter));
});
