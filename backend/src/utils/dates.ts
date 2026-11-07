const DAY_MS = 24 * 60 * 60 * 1000;

/** Durée moyenne d'une grossesse depuis la DDR (règle de Naegele). */
export const PREGNANCY_DAYS = 280;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}
