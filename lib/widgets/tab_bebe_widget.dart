import 'package:flutter/material.dart';

class TabBebeWidget extends StatelessWidget {
  const TabBebeWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // =====================================================
          // IMAGE DU BÉBÉ
          // =====================================================
          Container(
            height: 270,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFFFE4EC)),
            ),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: SizedBox(
                    width: double.infinity,
                    height: double.infinity,
                    child: Image.asset(
                      'assets/img_bebe.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // =====================================================
          // INFORMATIONS DU BÉBÉ
          // =====================================================
          const Text(
            'Votre bébé',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF252333),
            ),
          ),

          const SizedBox(height: 10),

          Row(
            children: [
              // POIDS
              Expanded(
                child: _InfoCard(
                  icon: Icons.monitor_weight_rounded,
                  titre: 'Poids',
                  valeur: '12 g',
                ),
              ),

              const SizedBox(width: 10),

              // TAILLE
              Expanded(
                child: _InfoCard(
                  icon: Icons.straighten_rounded,
                  titre: 'Taille',
                  valeur: '20,1 cm',
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // =====================================================
          // DÉVELOPPEMENT
          // =====================================================
          const Text(
            'Développement cette semaine',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF252333),
            ),
          ),

          const SizedBox(height: 10),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFEAF2),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFFD6E3)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icône
                Icon(
                  Icons.child_friendly_rounded,
                  size: 27,
                  color: Color(0xFFFF2D6F),
                ),

                SizedBox(width: 12),

                Expanded(
                  child: Text(
                    'Cette semaine, votre bébé bouge davantage '
                    'et ses organes continuent à se développer.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: Color(0xFF55515A),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // =====================================================
          // À SAVOIR
          // =====================================================
          const Text(
            'À savoir',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF252333),
            ),
          ),

          const SizedBox(height: 10),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFFE0EA)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cercle de l'icône
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Color(0xFFFFE6EF),
                  child: Icon(
                    Icons.lightbulb_outline_rounded,
                    size: 21,
                    color: Color(0xFFFF2D6F),
                  ),
                ),

                SizedBox(width: 12),

                Expanded(
                  child: Text(
                    'Ses empreintes digitales commencent '
                    'à se développer.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: Color(0xFF55515A),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================
// CARTE INFORMATION
// =============================================================

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.titre,
    required this.valeur,
  });

  final IconData icon;
  final String titre;
  final String valeur;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFFE0EA)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFFFFE6EF),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 21, color: Color(0xFFFF2D6F)),
          ),

          const SizedBox(width: 10),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titre,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),

                const SizedBox(height: 3),

                Text(
                  valeur,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFD81B60),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
