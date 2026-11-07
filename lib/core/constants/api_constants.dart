/// Configuration de l'API backend (Node/Express).
class ApiConstants {
  ApiConstants._();

  static const String _prodBaseUrl = 'https://api.lahiyarouwadayaro.com/api';

  /// URL de base du backend : l'API en ligne par défaut, en debug comme en
  /// release, pour pouvoir tester l'app sur un vrai téléphone sans rien
  /// configurer.
  ///
  /// Pour viser un backend local (`npm run dev` dans backend/), surcharger
  /// au lancement :
  /// - émulateur Android : `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api`
  /// - web / Windows : `flutter run --dart-define=API_BASE_URL=http://localhost:3000/api`
  /// - téléphone sur le même wifi : `--dart-define=API_BASE_URL=http://<IP du PC>:3000/api`
  ///   (en http, Android exige en plus d'autoriser le trafic en clair : à
  ///   réserver aux tests locaux).
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _prodBaseUrl,
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
