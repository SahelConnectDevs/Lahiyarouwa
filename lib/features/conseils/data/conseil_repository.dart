import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';
import 'models/conseil_model.dart';

/// Conseils santé publiés (contenu public, géré depuis l'admin-web).
class ConseilRepository {
  ConseilRepository(this._apiClient);

  final ApiClient _apiClient;

  /// Conseils publiés en français ; avec [semaine], seulement ceux
  /// pertinents à ce stade de la grossesse.
  Future<List<ConseilModel>> fetch({int? semaine}) async {
    final response = await _apiClient.get(
      ApiEndpoints.conseils.list,
      queryParameters: {'langue': 'fr', 'semaine': ?semaine},
    );
    return (response.data as List)
        .map((e) => ConseilModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
