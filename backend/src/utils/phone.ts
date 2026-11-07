/** Indicatif par défaut appliqué à un numéro local à 8 chiffres (Niger). */
const DEFAULT_COUNTRY_CODE = '+227';

/**
 * Normalise un numéro de téléphone au format international "+<chiffres>",
 * pour qu'un même numéro saisi "90 12 34 56", "+227 90123456" ou
 * "0022790123456" corresponde toujours au même compte.
 * Renvoie null si le numéro n'est pas plausible.
 */
export function normalizePhone(raw: string): string | null {
  let value = raw.replace(/[\s.\-()]/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (/^\d{8}$/.test(value)) value = `${DEFAULT_COUNTRY_CODE}${value}`;
  return /^\+\d{8,15}$/.test(value) ? value : null;
}
