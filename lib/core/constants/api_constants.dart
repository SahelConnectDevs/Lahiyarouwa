import 'package:flutter/foundation.dart' show kDebugMode;

/// Configuration de l'API backend (Node/Express).
class ApiConstants {
  ApiConstants._();

  /// URL de base du backend selon l'environnement.
  ///
  /// En dev, adapte l'IP à ton setup :
  /// - émulateur Android : http://10.0.2.2:3000/api
  /// - device physique / simulateur iOS / web : http://`IP de ta machine`:3000/api
  static const String _devBaseUrl = 'http://localhost:3000/api';
  static const String _prodBaseUrl = 'https://api.lahiyarouwa.com/api';

  static String get baseUrl => kDebugMode ? _devBaseUrl : _prodBaseUrl;

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);
}
