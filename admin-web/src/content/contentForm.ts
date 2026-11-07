/**
 * Description déclarative des formulaires de contenu (conseils, vaccins,
 * étapes CPN, méthodes PF) et conversion formulaire <-> corps JSON de l'API.
 * Les règles reflètent les validators du backend
 * (backend/src/validators/admin.validator.ts et pf.validator.ts).
 */

export interface Option {
  value: string;
  label: string;
}

interface BaseField {
  /** Chemin dans le document, avec un point pour un sous-objet (ex: "rappel.mode"). */
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Occupe toute la largeur du formulaire. */
  wide?: boolean;
}

export type Field =
  | (BaseField & { type: 'text'; max?: number; pattern?: string; placeholder?: string })
  | (BaseField & { type: 'textarea'; max?: number; rows?: number })
  | (BaseField & { type: 'number'; min?: number; max?: number; nullable?: boolean })
  | (BaseField & { type: 'select'; options: Option[]; defaultValue?: string })
  | (BaseField & { type: 'checkbox'; defaultValue?: boolean })
  | (BaseField & { type: 'list'; placeholder?: string });

/** Valeurs du formulaire : chaînes pour les champs texte, booléens pour les cases. */
export type FormValues = Record<string, string | boolean>;

export function getPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

export function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let node = target;
  for (const key of keys.slice(0, -1)) {
    if (!node[key] || typeof node[key] !== 'object') node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]] = value;
}

/** Valeurs initiales du formulaire, pour une création (`item` absent) ou une modification. */
export function toFormValues(fields: Field[], item?: Record<string, unknown>): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = item ? getPath(item, field.name) : undefined;
    switch (field.type) {
      case 'checkbox':
        values[field.name] = typeof raw === 'boolean' ? raw : (field.defaultValue ?? false);
        break;
      case 'list':
        values[field.name] = Array.isArray(raw) ? raw.join('\n') : '';
        break;
      case 'select':
        values[field.name] = raw !== undefined && raw !== null ? String(raw) : (field.defaultValue ?? '');
        break;
      default:
        values[field.name] = raw !== undefined && raw !== null ? String(raw) : '';
    }
  }
  return values;
}

/**
 * Corps JSON envoyé à l'API. Un champ facultatif vidé est omis à la création
 * et effacé (`null`) en modification quand l'API l'accepte.
 */
export function toPayload(fields: Field[], values: FormValues, mode: 'create' | 'update'): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    switch (field.type) {
      case 'checkbox':
        setPath(payload, field.name, Boolean(value));
        break;
      case 'list':
        setPath(
          payload,
          field.name,
          String(value ?? '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        );
        break;
      case 'number': {
        const text = String(value ?? '').trim();
        if (text !== '') setPath(payload, field.name, Number(text));
        else if (mode === 'update' && field.nullable) setPath(payload, field.name, null);
        break;
      }
      case 'select': {
        const text = String(value ?? '');
        if (text !== '') setPath(payload, field.name, text);
        break;
      }
      default: {
        const text = String(value ?? '').trim();
        if (text !== '') setPath(payload, field.name, text);
        else if (mode === 'update' && !field.required) setPath(payload, field.name, null);
      }
    }
  }
  return payload;
}
