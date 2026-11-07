/// Conseil santé publié depuis l'admin-web (`GET /conseils`).
class ConseilModel {
  const ConseilModel({
    required this.id,
    required this.titre,
    required this.contenu,
    required this.categorie,
    this.icone,
  });

  factory ConseilModel.fromJson(Map<String, dynamic> json) => ConseilModel(
    id: json['id'].toString(),
    titre: json['titre'] as String,
    contenu: json['contenu'] as String,
    categorie: (json['categorie'] as String?) ?? 'general',
    icone: json['icone'] as String?,
  );

  final String id;
  final String titre;
  final String contenu;

  /// `grossesse`, `bebe`, `nutrition`, `planning_familial`, `hygiene` ou `general`.
  final String categorie;

  /// Nom d'icône Material choisi dans l'admin (ex: `water_drop`), facultatif.
  final String? icone;
}
