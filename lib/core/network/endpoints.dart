/// Chemins des routes exposées par le backend Express, relatifs à
/// [ApiConstants.baseUrl] — un groupe par feature (voir
/// `backend/src/routes/index.ts` pour la liste côté serveur).
class ApiEndpoints {
  ApiEndpoints._();

  static const AuthEndpoints auth = AuthEndpoints();
  static const GrossesseEndpoints grossesse = GrossesseEndpoints();
  static const VaccinationEndpoints vaccination = VaccinationEndpoints();
  static const ConseilEndpoints conseils = ConseilEndpoints();
  static const AlerteEndpoints alertes = AlerteEndpoints();
  static const ContractionEndpoints contractions = ContractionEndpoints();
}

class AuthEndpoints {
  const AuthEndpoints();

  String get login => '/auth/login';
  String get register => '/auth/register';
  String get me => '/auth/me';
}

class GrossesseEndpoints {
  const GrossesseEndpoints();

  /// GET : grossesse en cours (ou `null`) ; PUT `{ ddr }` : crée ou corrige.
  String get current => '/grossesse';
  String get cpn => '/grossesse/cpn';
  String cpnVisit(int numero) => '/grossesse/cpn/$numero';
}

class VaccinationEndpoints {
  const VaccinationEndpoints();

  /// Calendrier personnalisé (vaccins de la maman sans `?enfant=`).
  String get calendrier => '/vaccinations/calendrier';
  String get records => '/vaccinations';
}

class ConseilEndpoints {
  const ConseilEndpoints();

  String get list => '/conseils';
}

class AlerteEndpoints {
  const AlerteEndpoints();

  String get list => '/alertes';
}

class ContractionEndpoints {
  const ContractionEndpoints();

  String get sessions => '/contractions';
}
