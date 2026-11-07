import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/utils/load_status.dart';
import '../data/conseil_repository.dart';
import '../data/models/conseil_model.dart';

/// Conseils santé affichés dans l'onglet « Conseils » et sur l'accueil.
class ConseilProvider extends ChangeNotifier {
  ConseilProvider(this._repository);

  final ConseilRepository _repository;

  LoadStatus status = LoadStatus.initial;
  List<ConseilModel> conseils = const [];
  String? errorMessage;

  /// Conseil mis en avant sur l'accueil : change chaque jour.
  ConseilModel? conseilDuJour({DateTime? now}) {
    if (conseils.isEmpty) return null;
    final day = (now ?? DateTime.now()).difference(DateTime(2026)).inDays;
    return conseils[day.abs() % conseils.length];
  }

  /// Semaine de grossesse du dernier chargement, réutilisée par [refresh].
  int? _semaine;

  /// Recharge avec la même semaine que le dernier [load] (tirer pour actualiser).
  Future<void> refresh() => load(semaine: _semaine);

  Future<void> load({int? semaine}) async {
    _semaine = semaine;
    status = LoadStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      conseils = await _repository.fetch(semaine: semaine);
      status = LoadStatus.loaded;
    } on AppException catch (e) {
      errorMessage = e.message;
      status = LoadStatus.error;
    }
    notifyListeners();
  }

  void reset() {
    _semaine = null;
    status = LoadStatus.initial;
    conseils = const [];
    errorMessage = null;
    notifyListeners();
  }
}
