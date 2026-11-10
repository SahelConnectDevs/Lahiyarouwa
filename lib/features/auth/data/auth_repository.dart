import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';
import '../../../core/utils/dates.dart';
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

  /// Connexion par numéro de téléphone au format international
  /// (`+22790123456`, tel que fourni par `PhoneFieldWidget`).
  Future<UserModel> login({
    required String phone,
    required String password,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.auth.login,
      data: {'phone': phone, 'password': password},
    );
    return _storeSession(response.data);
  }

  /// Crée le compte et ouvre directement la session (l'API renvoie
  /// `{ token, user }` comme pour la connexion).
  Future<UserModel> register({
    required String name,
    required String phone,
    required String password,
    DateTime? birthDate,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.auth.register,
      data: {
        'name': name,
        'phone': phone,
        'password': password,
        if (birthDate != null) 'birthDate': Dates.toApiDate(birthDate),
      },
    );
    return _storeSession(response.data);
  }

  Future<UserModel> _storeSession(dynamic body) async {
    final data = body as Map<String, dynamic>;
    // Compte administrateur : l'API attend un code envoyé par e-mail (double
    // authentification) au lieu de renvoyer un token. L'administration se
    // fait sur l'espace web, pas dans l'app.
    if (data['mfaRequired'] == true) {
      throw const ServerException(
        'Ce compte administrateur se connecte sur admin.lahiyarouwadayaro.com, pas dans l’application.',
      );
    }
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
