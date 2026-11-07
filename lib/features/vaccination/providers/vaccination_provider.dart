import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/utils/load_status.dart';
import '../data/models/vaccine_entry_model.dart';
import '../data/vaccination_repository.dart';

/// Calendrier vaccinal de la maman, affiché par l'onglet « Vaccin » et la
/// carte « Prochain vaccin » de l'accueil.
class VaccinationProvider extends ChangeNotifier {
  VaccinationProvider(this._repository);

  final VaccinationRepository _repository;

  LoadStatus status = LoadStatus.initial;
  List<VaccineEntryModel> calendar = const [];
  String? errorMessage;
  bool isSaving = false;

  int get doneCount => calendar.where((v) => v.isDone).length;
  int get pendingCount => calendar.length - doneCount;

  /// Premier vaccin pas encore reçu, dans l'ordre du calendrier.
  VaccineEntryModel? get next {
    for (final entry in calendar) {
      if (!entry.isDone) return entry;
    }
    return null;
  }

  Future<void> load() async {
    status = LoadStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      calendar = await _repository.fetchMotherCalendar();
      status = LoadStatus.loaded;
    } on AppException catch (e) {
      errorMessage = e.message;
      status = LoadStatus.error;
    }
    notifyListeners();
  }

  /// Enregistre une dose reçue puis recharge le calendrier.
  Future<bool> recordDose(String vaccinId, DateTime date) async {
    isSaving = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.recordDose(vaccinId: vaccinId, date: date);
      calendar = await _repository.fetchMotherCalendar();
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }

  void reset() {
    status = LoadStatus.initial;
    calendar = const [];
    errorMessage = null;
    isSaving = false;
    notifyListeners();
  }
}
