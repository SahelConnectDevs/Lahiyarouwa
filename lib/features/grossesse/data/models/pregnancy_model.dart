import '../../../../core/utils/dates.dart';

/// Grossesse en cours telle que renvoyée par `GET/PUT /grossesse`, avec
/// les valeurs calculées par l'API à partir de la DDR
/// (voir `backend/src/services/grossesse.service.ts`).
class PregnancyModel {
  const PregnancyModel({
    required this.id,
    required this.ddr,
    required this.termePrevu,
    required this.semaine,
    required this.jour,
    required this.joursRestants,
    required this.trimestre,
  });

  factory PregnancyModel.fromJson(Map<String, dynamic> json) => PregnancyModel(
    id: json['id'].toString(),
    ddr: Dates.parse(json['ddr'])!,
    termePrevu: Dates.parse(json['termePrevu'])!,
    semaine: (json['semaine'] as num).toInt(),
    jour: (json['jour'] as num).toInt(),
    joursRestants: (json['joursRestants'] as num).toInt(),
    trimestre: (json['trimestre'] as num).toInt(),
  );

  final String id;

  /// Date des dernières règles.
  final DateTime ddr;

  /// Date prévue d'accouchement (DDR + 280 jours).
  final DateTime termePrevu;

  /// Semaines d'aménorrhée révolues (ex: 24 pour « 24 SA + 3 j »).
  final int semaine;

  /// Jours au-delà des semaines révolues (0 à 6).
  final int jour;
  final int joursRestants;

  /// 1, 2 ou 3.
  final int trimestre;

  /// Avancement de la grossesse, de 0 à 1 (40 semaines).
  double get progression => ((semaine * 7 + jour) / 280).clamp(0.0, 1.0);

  /// Semaines restantes avant le terme (arrondi supérieur).
  int get semainesRestantes => (joursRestants / 7).ceil();
}
