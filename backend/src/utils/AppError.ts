/**
 * Erreur métier avec status code HTTP et, pour les erreurs de validation,
 * un détail par champ. Consommée par middlewares/error.middleware.ts pour
 * produire exactement le format attendu côté client mobile — voir
 * lib/core/errors/app_exception.dart côté Flutter :
 *   { message: string, errors?: { [champ]: raison } }
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message = 'Non autorisé.'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Accès refusé.'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Ressource introuvable.'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static validation(message: string, fieldErrors: Record<string, string>): AppError {
    return new AppError(message, 422, fieldErrors);
  }
}
