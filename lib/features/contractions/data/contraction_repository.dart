import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';

/// Une contraction mesurée par le minuteur.
typedef Contraction = ({DateTime debut, DateTime fin});

/// Sauvegarde des séances de suivi des contractions.
class ContractionRepository {
  ContractionRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<void> saveSession({
    required DateTime debut,
    required DateTime fin,
    required List<Contraction> contractions,
  }) async {
    await _apiClient.post(
      ApiEndpoints.contractions.sessions,
      data: {
        'debut': debut.toUtc().toIso8601String(),
        'fin': fin.toUtc().toIso8601String(),
        'contractions': [
          for (final c in contractions)
            {
              'debut': c.debut.toUtc().toIso8601String(),
              'fin': c.fin.toUtc().toIso8601String(),
            },
        ],
      },
    );
  }
}
