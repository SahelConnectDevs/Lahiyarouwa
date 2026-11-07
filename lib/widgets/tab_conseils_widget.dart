import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/load_status.dart';
import '../features/conseils/data/models/conseil_model.dart';
import '../features/conseils/providers/conseil_provider.dart';

/// Onglet « Conseils » du suivi de grossesse : conseils publiés depuis
/// l'admin-web, adaptés à la semaine de grossesse.
class TabConseilsWidget extends StatelessWidget {
  const TabConseilsWidget({super.key});

  /// Icônes choisissables dans l'admin (champ « Icône »), avec un repli
  /// par catégorie quand le nom est absent ou inconnu.
  static const _icons = <String, IconData>{
    'water_drop': Icons.water_drop,
    'restaurant': Icons.restaurant,
    'bedtime': Icons.bedtime,
    'calendar_month': Icons.calendar_month,
    'favorite': Icons.favorite,
    'child_care': Icons.child_care,
    'pregnant_woman': Icons.pregnant_woman,
    'clean_hands': Icons.clean_hands,
    'medication': Icons.medication,
    'vaccines': Icons.vaccines,
    'directions_walk': Icons.directions_walk,
    'family_restroom': Icons.family_restroom,
    'health_and_safety': Icons.health_and_safety,
  };

  static const _categoryIcons = <String, IconData>{
    'grossesse': Icons.pregnant_woman,
    'bebe': Icons.child_care,
    'nutrition': Icons.restaurant,
    'planning_familial': Icons.family_restroom,
    'hygiene': Icons.clean_hands,
  };

  static IconData iconFor(ConseilModel conseil) =>
      _icons[conseil.icone] ??
      _categoryIcons[conseil.categorie] ??
      Icons.lightbulb_outline;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ConseilProvider>();
    final conseils = provider.conseils;

    return RefreshIndicator(
      color: const Color(0xFFD81B60),
      onRefresh: provider.refresh,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const Text(
            'Conseils de la semaine',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFFD81B60),
            ),
          ),

          const SizedBox(height: 15),

          if (provider.status == LoadStatus.loading && conseils.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFFD81B60)),
              ),
            )
          else if (conseils.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                provider.status == LoadStatus.error
                    ? provider.errorMessage ??
                          'Impossible de charger les conseils.'
                    : 'Aucun conseil pour le moment.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF55515A)),
              ),
            )
          else
            for (final conseil in conseils) _ConseilCard(conseil: conseil),
        ],
      ),
    );
  }
}

class _ConseilCard extends StatelessWidget {
  const _ConseilCard({required this.conseil});

  final ConseilModel conseil;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFFFE0EA)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: const BoxDecoration(
            color: Color(0xFFFFE6EF),
            shape: BoxShape.circle,
          ),
          child: Icon(
            TabConseilsWidget.iconFor(conseil),
            color: const Color(0xFFFF2D6F),
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                conseil.titre,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFD81B60),
                ),
              ),

              const SizedBox(height: 3),

              Text(
                conseil.contenu,
                style: const TextStyle(
                  fontSize: 11,
                  height: 1.4,
                  color: Color(0xFF55515A),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
