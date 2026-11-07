import '../../../core/network/api_client.dart';
import '../../../core/network/endpoints.dart';
import '../../../core/utils/dates.dart';
import 'models/vaccine_entry_model.dart';

/// Calendrier vaccinal de la maman et enregistrement des doses reçues.
class VaccinationRepository {
  VaccinationRepository(this._apiClient);

  final ApiClient _apiClient;

  /// Calendrier vaccinal de la maman (sans enfant).
  Future<List<VaccineEntryModel>> fetchMotherCalendar() async {
    final response = await _apiClient.get(ApiEndpoints.vaccination.calendrier);
    return (response.data as List)
        .map((e) => VaccineEntryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Enregistre une dose reçue par la maman.
  Future<void> recordDose({
    required String vaccinId,
    required DateTime date,
  }) async {
    await _apiClient.post(
      ApiEndpoints.vaccination.records,
      data: {'vaccin': vaccinId, 'date': Dates.toApiDate(date)},
    );
  }
}
