import '../../../../core/utils/dates.dart';

/// Statut d'un vaccin du calendrier, calculé par l'API.
enum VaccineStatus {
  fait,
  enRetard,
  aVenir;

  static VaccineStatus fromApi(String? value) => switch (value) {
    'fait' => VaccineStatus.fait,
    'en_retard' => VaccineStatus.enRetard,
    _ => VaccineStatus.aVenir,
  };
}

/// Une ligne du calendrier vaccinal personnalisé
/// (`GET /vaccinations/calendrier`) : le vaccin, sa date prévue et la dose
/// reçue s'il y en a une.
class VaccineEntryModel {
  const VaccineEntryModel({
    required this.vaccinId,
    required this.nom,
    required this.moment,
    required this.statut,
    this.dose,
    this.description,
    this.datePrevue,
    this.recueLe,
  });

  factory VaccineEntryModel.fromJson(Map<String, dynamic> json) {
    final vaccin = json['vaccin'] as Map<String, dynamic>;
    final dose = json['doseRecue'] as Map<String, dynamic>?;
    return VaccineEntryModel(
      vaccinId: vaccin['id'].toString(),
      nom: vaccin['nom'] as String,
      moment: (vaccin['moment'] as String?) ?? '',
      dose: vaccin['dose'] as String?,
      description: vaccin['description'] as String?,
      statut: VaccineStatus.fromApi(json['statut'] as String?),
      datePrevue: Dates.parse(json['datePrevue']),
      recueLe: Dates.parse(dose?['date']),
    );
  }

  final String vaccinId;
  final String nom;

  /// Moment recommandé en clair, ex: « Dès le 1er contact ».
  final String moment;

  /// Libellé de dose, ex: « Dose 1 ».
  final String? dose;
  final String? description;
  final VaccineStatus statut;

  /// Date recommandée (vaccins de l'enfant) ; null pour ceux de la maman.
  final DateTime? datePrevue;

  /// Date de la dose reçue, si elle a été enregistrée.
  final DateTime? recueLe;

  bool get isDone => statut == VaccineStatus.fait;
}
