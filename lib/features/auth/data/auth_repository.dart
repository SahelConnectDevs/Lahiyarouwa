import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';
import 'models/user_model.dart';

/// Parle au backend Express pour l'authentification.
///
/// Ne connaît rien de Provider ni de l'UI : fait uniquement des appels
/// API et mappe les réponses en modèles, ou laisse remonter une
/// AppException levée par ApiClient. Sert de modèle pour les
/// repositories des autres features.
class AuthRepository {
  AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<UserModel> login({required String email, required String password}) async {
    final response = await _apiClient.post(ApiEndpoints.auth.login, data: {'email': email, 'password': password});

    final data = response.data as Map<String, dynamic>;
    await _apiClient.saveToken(data['token'] as String);
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// Renvoie null s'il n'y a pas de session en cours (pas de token stocké),
  /// sans faire d'appel réseau dans ce cas.
  Future<UserModel?> fetchCurrentUser() async {
    final token = await _apiClient.readToken();
    if (token == null) return null;

    final response = await _apiClient.get(ApiEndpoints.auth.me);
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> logout() => _apiClient.clearToken();
}
