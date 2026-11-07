import 'dart:math' as math;

/// Taille et poids moyens du bébé à un stade de la grossesse.
class FetalSize {
  const FetalSize({
    required this.semaine,
    required this.tailleCm,
    required this.poidsG,
    required this.comparaison,
    required this.developpement,
    required this.echelle,
  });

  /// Semaines d'aménorrhée révolues.
  final int semaine;

  /// Taille moyenne : tête-fesses jusqu'à 19 SA, puis tête-talons.
  final double tailleCm;

  /// Poids moyen en grammes (0 tant qu'il est inférieur au gramme).
  final double poidsG;

  /// Objet de taille comparable, ex: « une mangue ».
  final String comparaison;

  /// Étape de développement de la période, en une phrase.
  final String developpement;

  /// Facteur d'affichage de l'illustration, de [FetalGrowth.minScale] à 1 :
  /// croît régulièrement avec le volume du bébé (racine cubique du poids),
  /// sans le saut que fait la mesure de taille à 20 SA.
  final double echelle;

  /// `12 g`, `1,2 kg`, `< 1 g`.
  String get poidsLabel {
    if (poidsG < 1) return '< 1 g';
    if (poidsG < 1000) return '${poidsG.round()} g';
    return '${(poidsG / 1000).toStringAsFixed(1).replaceAll('.', ',')} kg';
  }

  /// `5,4 cm`, `0,2 cm`.
  String get tailleLabel =>
      '${tailleCm.toStringAsFixed(1).replaceAll('.', ',')} cm';
}

/// Croissance moyenne du fœtus semaine par semaine (valeurs de référence
/// usuelles : longueur tête-fesses puis tête-talons à partir de 20 SA,
/// poids estimé). Valeurs indicatives : chaque bébé grandit à son rythme.
class FetalGrowth {
  FetalGrowth._();

  static const double minScale = 0.22;

  // semaine, taille (cm), poids (g), comparaison
  static const List<(int, double, double, String)> _table = [
    (4, 0.1, 0, 'une graine de pavot'),
    (5, 0.2, 0, 'une graine de sésame'),
    (6, 0.6, 0, 'une lentille'),
    (7, 1.3, 0, 'un haricot'),
    (8, 1.6, 1, 'une framboise'),
    (9, 2.3, 2, 'une cerise'),
    (10, 3.1, 4, 'une fraise'),
    (11, 4.1, 7, 'une figue'),
    (12, 5.4, 14, 'un citron vert'),
    (13, 7.4, 23, 'un citron'),
    (14, 8.7, 43, 'une pêche'),
    (15, 10.1, 70, 'une pomme'),
    (16, 11.6, 100, 'un avocat'),
    (17, 13.0, 140, 'une grenade'),
    (18, 14.2, 190, 'un poivron'),
    (19, 15.3, 240, 'une tomate'),
    (20, 25.6, 300, 'une banane'),
    (21, 26.7, 360, 'une carotte'),
    (22, 27.8, 430, 'une papaye'),
    (23, 28.9, 501, 'un pamplemousse'),
    (24, 30.0, 600, 'un épi de maïs'),
    (25, 34.6, 660, 'un chou-fleur'),
    (26, 35.6, 760, 'une laitue'),
    (27, 36.6, 875, 'un chou'),
    (28, 37.6, 1005, 'une aubergine'),
    (29, 38.6, 1153, 'une courge'),
    (30, 39.9, 1319, 'un gros concombre'),
    (31, 41.1, 1502, 'une noix de coco'),
    (32, 42.4, 1702, 'une grosse mangue'),
    (33, 43.7, 1918, 'un ananas'),
    (34, 45.0, 2146, 'un melon'),
    (35, 46.2, 2383, 'un melon miel'),
    (36, 47.4, 2622, 'une grosse papaye'),
    (37, 48.6, 2859, 'une botte de bettes'),
    (38, 49.8, 3083, 'un potiron'),
    (39, 50.7, 3288, 'une petite pastèque'),
    (40, 51.2, 3462, 'une pastèque'),
    (41, 51.7, 3597, 'une pastèque'),
    (42, 51.5, 3685, 'une grosse pastèque'),
  ];

  static const List<(int, String)> _developpement = [
    (
      4,
      'Le cœur commence à battre et les principaux organes se mettent en place.',
    ),
    (
      8,
      'Les bras, les jambes et les doigts se forment ; à la fin du 1er trimestre, tous les organes sont en place.',
    ),
    (
      13,
      'Votre bébé bouge déjà, même si vous ne le sentez pas encore. Ses os se renforcent.',
    ),
    (
      18,
      'Vous pourriez commencer à sentir ses mouvements. Il perçoit les sons.',
    ),
    (24, 'Ses poumons se développent et il réagit aux bruits et à votre voix.'),
    (28, 'Il ouvre les yeux, prend du poids et alterne sommeil et éveil.'),
    (
      34,
      'Ses poumons finissent de mûrir ; il se place souvent la tête en bas.',
    ),
    (
      37,
      'Il est prêt à naître et continue de prendre du poids jusqu’à l’accouchement.',
    ),
  ];

  /// Taille et poids moyens à [semaine] SA + [jour] jours, interpolés entre
  /// deux semaines pour évoluer chaque jour.
  static FetalSize at(int semaine, [int jour = 0]) {
    final first = _table.first.$1;
    final last = _table.last.$1;
    final s = semaine.clamp(first, last);
    final t = s >= last ? 0.0 : (jour.clamp(0, 6) / 7);
    final current = _table[s - first];
    final next = _table[math.min(s + 1, last) - first];

    double lerp(double a, double b) => a + (b - a) * t;
    // Pas d'interpolation de taille entre 19 et 20 SA : la mesure change
    // (tête-fesses -> tête-talons), on garde la valeur de la semaine.
    final taille = s == 19 ? current.$2 : lerp(current.$2, next.$2);
    final poids = lerp(current.$3, next.$3);

    return FetalSize(
      semaine: s,
      tailleCm: taille,
      poidsG: poids,
      comparaison: current.$4,
      developpement: _developpement.lastWhere((e) => s >= e.$1).$2,
      echelle: _scale(poids),
    );
  }

  static double _scale(double poidsG) {
    final max = math.pow(_table.last.$3, 1 / 3);
    final ratio = math.pow(math.max(poidsG, 0.0), 1 / 3) / max;
    return (minScale + (1 - minScale) * ratio).clamp(minScale, 1.0);
  }
}
