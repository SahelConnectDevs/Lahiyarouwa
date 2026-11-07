import '../../../../core/utils/dates.dart';

/// Statut d'une consultation prénatale, calculé par l'API.
enum CpnStatus {
  effectuee,
  enCours,
  enRetard,
  aVenir;

  static CpnStatus fromApi(String? value) => switch (value) {
    'effectuee' => CpnStatus.effectuee,
    'en_cours' => CpnStatus.enCours,
    'en_retard' => CpnStatus.enRetard,
    _ => CpnStatus.aVenir,
  };
}

/// Une étape du calendrier des CPN pour la grossesse en cours
/// (`GET /grossesse/cpn`), avec sa fenêtre de dates recommandée.
class CpnVisitModel {
  const CpnVisitModel({
    required this.numero,
    required this.titre,
    required this.periode,
    required this.statut,
    this.examens = const [],
    this.aApporter = const [],
    this.fenetreDebut,
    this.fenetreFin,
    this.effectueeLe,
    this.notes,
  });

  factory CpnVisitModel.fromJson(Map<String, dynamic> json) {
    final fenetre = json['fenetre'] as Map<String, dynamic>?;
    return CpnVisitModel(
      numero: (json['numero'] as num).toInt(),
      titre: json['titre'] as String,
      periode: json['periode'] as String,
      statut: CpnStatus.fromApi(json['statut'] as String?),
      examens: _strings(json['examens']),
      aApporter: _strings(json['aApporter']),
      fenetreDebut: Dates.parse(fenetre?['debut']),
      fenetreFin: Dates.parse(fenetre?['fin']),
      effectueeLe: Dates.parse(json['effectueeLe']),
      notes: json['notes'] as String?,
    );
  }

  static List<String> _strings(Object? value) =>
      value is List ? value.map((e) => e.toString()).toList() : const [];

  final int numero;
  final String titre;

  /// Libellé affiché tel quel, ex: « 14 – 20 semaines ».
  final String periode;
  final CpnStatus statut;
  final List<String> examens;
  final List<String> aApporter;

  /// Fenêtre recommandée pour cette grossesse ; absente pour la CPN post-natale.
  final DateTime? fenetreDebut;
  final DateTime? fenetreFin;
  final DateTime? effectueeLe;
  final String? notes;

  bool get isDone => statut == CpnStatus.effectuee;
}
