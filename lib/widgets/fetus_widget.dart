import 'package:flutter/material.dart';

/// Illustration du bébé, dont la taille suit sa croissance réelle.
///
/// [echelle] vient de `FetalSize.echelle` (0,22 en début de grossesse, 1 au
/// terme). Le bébé « grandit » en animation jusqu'à sa taille à chaque
/// affichage et à chaque changement de semaine.
class FetusWidget extends StatelessWidget {
  const FetusWidget({super.key, required this.echelle, required this.size});

  final double echelle;

  /// Côté du carré réservé à l'illustration (taille au terme).
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: echelle * 0.6, end: echelle),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutBack,
        builder: (context, value, child) =>
            Transform.scale(scale: value, child: child),
        child: Image.asset(
          'assets/img_bebe.png',
          fit: BoxFit.contain,
          semanticLabel: 'Illustration du bébé',
        ),
      ),
    );
  }
}
