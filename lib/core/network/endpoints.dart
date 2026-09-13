/// Chemins des routes exposées par le backend Express, relatifs à
/// [ApiConstants.baseUrl].
///
/// Regroupe les endpoints par feature au fur et à mesure qu'elles
/// consomment l'API (voir ApiEndpoints.auth pour l'exemple).
class ApiEndpoints {
  ApiEndpoints._();

  static const AuthEndpoints auth = AuthEndpoints();

  // Ajoute ici les autres groupes au fur et à mesure, ex:
  // static const GrossesseEndpoints grossesse = GrossesseEndpoints();
}

class AuthEndpoints {
  const AuthEndpoints();

  String get login => '/auth/login';
  String get register => '/auth/register';
  String get me => '/auth/me';
}
