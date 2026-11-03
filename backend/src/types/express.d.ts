import type { UserDocument } from '../models/User';

// Augmente Request avec l'utilisateur authentifié, attaché par
// middlewares/auth.middleware.ts. Un fichier .d.ts avec un `export {}`
// (module augmentation) plutôt qu'un import direct, pour ne pas forcer
// chaque fichier à importer ce type manuellement.
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
