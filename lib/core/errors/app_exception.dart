/// Exceptions typées levées par la couche réseau/repositories.
///
/// Les Provider attrapent ces exceptions et les traduisent en message
/// affichable, sans jamais exposer les détails techniques (Dio, HTTP...) à l'UI.
sealed class AppException implements Exception {
  const AppException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Pas de connexion, timeout, ou hôte injoignable.
class NetworkException extends AppException {
  const NetworkException([super.message = 'Impossible de contacter le serveur. Vérifie ta connexion.']);
}

/// Réponse 4xx/5xx du backend Express sans catégorie plus précise,
/// avec le message renvoyé par l'API si disponible.
class ServerException extends AppException {
  const ServerException(super.message, {this.statusCode});

  final int? statusCode;
}

/// 401/403 — token absent, invalide ou expiré.
class UnauthorizedException extends AppException {
  const UnauthorizedException([super.message = 'Session expirée, reconnecte-toi.']);
}

/// 400/422 avec erreurs de validation par champ (format classique
/// express-validator : { message, errors: { champ: raison } }).
class ValidationException extends AppException {
  const ValidationException(super.message, this.fieldErrors);

  final Map<String, String> fieldErrors;
}
