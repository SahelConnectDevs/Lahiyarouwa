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
  bool isLoading = false;

  /// À appeler une fois au démarrage (voir main.dart) pour restaurer
  /// une session existante à partir du token stocké.
  Future<void> restoreSession() async {
    try {
      final user = await _authRepository.fetchCurrentUser();
      currentUser = user;
      status = user != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    } on AppException {
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      currentUser = await _authRepository.login(email: email, password: password);
      status = AuthStatus.authenticated;
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      status = AuthStatus.unauthenticated;
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
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
    currentUser = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
