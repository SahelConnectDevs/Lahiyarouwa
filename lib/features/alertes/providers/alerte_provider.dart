import 'package:flutter/foundation.dart';

import '../../../core/errors/app_exception.dart';
import '../data/alerte_repository.dart';

/// Envoi d'un signalement depuis l'écran « Signaler un signe ».
class AlerteProvider extends ChangeNotifier {
  AlerteProvider(this._repository);

  final AlerteRepository _repository;

  bool isSending = false;
  String? errorMessage;

  Future<bool> signal(String signe, {String? details}) async {
    isSending = true;
    errorMessage = null;
    notifyListeners();
    try {
      await _repository.signal(signe: signe, details: details);
      return true;
    } on AppException catch (e) {
      errorMessage = e.message;
      return false;
    } finally {
      isSending = false;
      notifyListeners();
    }
  }
}
