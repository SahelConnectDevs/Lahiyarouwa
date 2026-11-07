/// Outils de dates partagés : lecture des dates ISO de l'API et affichage
/// en français, sans dépendance supplémentaire (utilisable sans Flutter,
/// donc depuis les repositories et les tests).
class Dates {
  Dates._();

  static const _months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];

  /// Lit une date ISO 8601 renvoyée par l'API (`null` si absente) et la
  /// ramène à l'heure locale.
  static DateTime? parse(Object? value) =>
      value is String ? DateTime.tryParse(value)?.toLocal() : null;

  /// Date à envoyer à l'API. Un jour passé part en date seule
  /// (`2026-03-14`) pour qu'un décalage horaire ne le fasse pas glisser ;
  /// aujourd'hui part en instant précis, sinon `2026-03-14` (minuit UTC)
  /// serait « dans le futur » pour l'API juste après minuit au Niger (UTC+1).
  static String toApiDate(DateTime date, {DateTime? now}) {
    final current = now ?? DateTime.now();
    if (_dateOnly(date) == _dateOnly(current)) {
      return current.toUtc().toIso8601String();
    }
    return '${date.year.toString().padLeft(4, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';
  }

  /// `14 mars 2026`.
  static String long(DateTime date) =>
      '${date.day} ${_months[date.month - 1]} ${date.year}';

  /// `14/03/2026`.
  static String short(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/${date.year}';

  /// Nombre de jours calendaires entre aujourd'hui et [date] (négatif si passé).
  /// Arrondi à l'heure près pour rester juste lors d'un changement d'heure.
  static int daysFromToday(DateTime date, {DateTime? now}) =>
      (_dateOnly(date).difference(_dateOnly(now ?? DateTime.now())).inHours /
              24)
          .round();

  static DateTime _dateOnly(DateTime date) =>
      DateTime(date.year, date.month, date.day);
}
