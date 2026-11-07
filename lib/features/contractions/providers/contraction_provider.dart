import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../data/contraction_repository.dart';

/// Enregistrement d'une séance de contractions à la fin du suivi.
class ContractionProvider extends ChangeNotifier {
  ContractionProvider(this._repository);

  final ContractionRepository _repository;

  bool isSaving = false;
  String? errorMessage;

  Future<bool> saveSession({
    required DateTime debut,
    required DateTime fin,
    required List<Contraction> contractions,
  }) async {
    isSaving = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.saveSession(
        debut: debut,
        fin: fin,
        contractions: contractions,
      );
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }
}
