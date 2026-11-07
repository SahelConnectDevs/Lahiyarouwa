import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../data/auth_repository.dart';
import '../data/models/user_model.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// État d'authentification global de l'app, fourni en haut de l'arbre
/// (voir main.dart) et lu par les features qui ont besoin de savoir
/// qui est connecté ou de guarder une route.
class AuthProvider extends ChangeNotifier {
  AuthProvider(this._authRepository);

  final AuthRepository _authRepository;

  AuthStatus status = AuthStatus.unknown;
  UserModel? currentUser;
  String? errorMessage;

  /// Erreurs par champ renvoyées par l'API (ex: `phone` déjà utilisé).
  Map<String, String> fieldErrors = const {};
  bool isLoading = false;

  /// Prénom (premier mot du nom), pour les salutations.
  String get firstName => currentUser?.name.trim().split(' ').first ?? '';

  /// À appeler une fois au démarrage (voir main.dart) pour restaurer
  /// une session existante à partir du token stocké.
  Future<void> restoreSession() async {
    try {
      final user = await _authRepository.fetchCurrentUser();
      currentUser = user;
      status = user != null
          ? AuthStatus.authenticated
          : AuthStatus.unauthenticated;
    } on AppException {
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login({required String phone, required String password}) =>
      _authenticate(
        () => _authRepository.login(phone: phone, password: password),
      );

  Future<bool> register({
    required String name,
    required String phone,
    required String password,
    DateTime? birthDate,
  }) => _authenticate(
    () => _authRepository.register(
      name: name,
      phone: phone,
      password: password,
      birthDate: birthDate,
    ),
  );

  Future<bool> _authenticate(Future<UserModel> Function() call) async {
    isLoading = true;
    errorMessage = null;
    fieldErrors = const {};
    notifyListeners();

    try {
      currentUser = await call();
      status = AuthStatus.authenticated;
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      if (e is ValidationException) fieldErrors = e.fieldErrors;
      status = AuthStatus.unauthenticated;
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Efface le message d'erreur affiché (ex: en quittant un formulaire).
  void clearError() {
    if (errorMessage == null && fieldErrors.isEmpty) return;
    errorMessage = null;
    fieldErrors = const {};
    notifyListeners();
  }

  Future<void> logout() async {
    await _authRepository.logout();
    currentUser = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Appelé par ApiClient.onUnauthorized quand le backend renvoie 401
  /// (token expiré) — voir le câblage dans main.dart.
  void forceLogout() {
    if (status == AuthStatus.unauthenticated) return;
    _authRepository.logout();
    currentUser = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
