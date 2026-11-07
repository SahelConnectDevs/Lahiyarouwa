import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';
import '../../../core/utils/dates.dart';
import 'models/cpn_visit_model.dart';
import 'models/pregnancy_model.dart';

/// Suivi de grossesse : DDR, grossesse en cours et calendrier des CPN.
class GrossesseRepository {
  GrossesseRepository(this._apiClient);

  final ApiClient _apiClient;

  /// Grossesse en cours, ou `null` si l'utilisatrice n'en a pas déclaré.
  Future<PregnancyModel?> fetchCurrent() async {
    final response = await _apiClient.get(ApiEndpoints.grossesse.current);
    final data = response.data;
    return data is Map<String, dynamic> ? PregnancyModel.fromJson(data) : null;
  }

  /// Crée la grossesse en cours à partir de la DDR, ou corrige la DDR.
  Future<PregnancyModel> setDdr(DateTime ddr) async {
    final response = await _apiClient.put(
      ApiEndpoints.grossesse.current,
      data: {'ddr': Dates.toApiDate(ddr)},
    );
    return PregnancyModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<CpnVisitModel>> fetchCpn() async {
    final response = await _apiClient.get(ApiEndpoints.grossesse.cpn);
    return (response.data as List)
        .map((e) => CpnVisitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Marque une CPN comme effectuée (à [date], aujourd'hui par défaut) ou
  /// annule ce marquage.
  Future<CpnVisitModel> markCpn(
    int numero, {
    required bool effectuee,
    DateTime? date,
  }) async {
    final response = await _apiClient.put(
      ApiEndpoints.grossesse.cpnVisit(numero),
      data: {
        'effectuee': effectuee,
        if (date != null) 'date': Dates.toApiDate(date),
      },
    );
    return CpnVisitModel.fromJson(response.data as Map<String, dynamic>);
  }
}
