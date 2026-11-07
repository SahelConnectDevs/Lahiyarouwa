import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/utils/load_status.dart';
import '../data/fetal_growth.dart';
import '../data/grossesse_repository.dart';
import '../data/models/cpn_visit_model.dart';
import '../data/models/pregnancy_model.dart';

/// État du suivi de grossesse : grossesse en cours et calendrier des CPN.
/// Chargé une fois la session ouverte (voir main.dart), vidé à la déconnexion.
class GrossesseProvider extends ChangeNotifier {
  GrossesseProvider(this._repository);

  final GrossesseRepository _repository;

  LoadStatus status = LoadStatus.initial;
  PregnancyModel? pregnancy;
  List<CpnVisitModel> cpn = const [];
  String? errorMessage;

  /// Vrai pendant l'enregistrement de la DDR ou d'une CPN.
  bool isSaving = false;

  /// L'utilisatrice a choisi « Plus tard » sur l'écran de la DDR (le temps
  /// de la session) : l'app s'ouvre alors sans grossesse déclarée.
  bool ddrSkipped = false;

  bool get hasPregnancy => pregnancy != null;

  /// Taille et poids moyens du bébé à ce jour (null sans grossesse).
  FetalSize? get fetalSize {
    final p = pregnancy;
    return p == null ? null : FetalGrowth.at(p.semaine, p.jour);
  }

  /// Prochaine consultation à faire (en retard, en cours, puis à venir).
  CpnVisitModel? get nextCpn {
    for (final visit in cpn) {
      if (!visit.isDone) return visit;
    }
    return null;
  }

  int get cpnDoneCount => cpn.where((v) => v.isDone).length;

  Future<void> load() async {
    status = LoadStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      pregnancy = await _repository.fetchCurrent();
      cpn = pregnancy != null ? await _repository.fetchCpn() : const [];
      status = LoadStatus.loaded;
    } on AppException catch (e) {
      errorMessage = e.message;
      status = LoadStatus.error;
    }
    notifyListeners();
  }

  /// Enregistre la DDR (crée ou corrige la grossesse) puis recharge les CPN,
  /// dont les dates dépendent de la DDR. Renvoie false en cas d'erreur
  /// (message dans [errorMessage]).
  Future<bool> setDdr(DateTime ddr) async {
    isSaving = true;
    errorMessage = null;
    notifyListeners();
    try {
      pregnancy = await _repository.setDdr(ddr);
      cpn = await _repository.fetchCpn();
      status = LoadStatus.loaded;
      return true;
    } on AppException catch (e) {
      errorMessage = e is ValidationException && e.fieldErrors['ddr'] != null
          ? e.fieldErrors['ddr']
          : e.message;
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }

  Future<bool> markCpn(int numero, {required bool effectuee}) async {
    isSaving = true;
    errorMessage = null;
    notifyListeners();
    try {
      final updated = await _repository.markCpn(numero, effectuee: effectuee);
      cpn = [for (final v in cpn) v.numero == numero ? updated : v];
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }

  void skipDdr() {
    ddrSkipped = true;
    notifyListeners();
  }

  /// Vide l'état (déconnexion) pour ne rien laisser à la session suivante.
  void reset() {
    status = LoadStatus.initial;
    pregnancy = null;
    cpn = const [];
    errorMessage = null;
    isSaving = false;
    ddrSkipped = false;
    notifyListeners();
  }
}
