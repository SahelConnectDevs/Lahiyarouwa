import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';

/// Signalement d'un signe inquiétant (transmis à l'équipe et à l'agent
/// communautaire de l'utilisatrice).
class AlerteRepository {
  AlerteRepository(this._apiClient);

  final ApiClient _apiClient;

  /// Libellés acceptés par l'API (`ALERT_SIGNS` dans
  /// `backend/src/models/Alert.ts`) : à garder identiques.
  static const signes = [
    'Saignement vaginal',
    'Forte fièvre',
    'Maux de tête sévères',
    'Vision trouble',
    'Douleur abdominale intense',
    'Absence de mouvements du bébé',
    'Perte de liquide',
    'Convulsions',
    'Autre signe',
  ];

  Future<void> signal({required String signe, String? details}) async {
    await _apiClient.post(
      ApiEndpoints.alertes.list,
      data: {
        'signe': signe,
        if (details != null && details.trim().isNotEmpty)
          'details': details.trim(),
      },
    );
  }
}
