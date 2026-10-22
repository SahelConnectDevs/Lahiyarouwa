import 'package:flutter/material.dart';

class TabConseilsWidget extends StatelessWidget {
  const TabConseilsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final conseils = [
      {
        'icon': Icons.restaurant,
        'titre': 'Alimentation',
        'texte': 'Privilégiez une alimentation variée et équilibrée.',
      },
      {
        'icon': Icons.water_drop,
        'titre': 'Hydratation',
        'texte': 'Buvez régulièrement de l’eau au cours de la journée.',
      },
      {
        'icon': Icons.bedtime,
        'titre': 'Repos',
        'texte': 'Accordez-vous suffisamment de temps pour vous reposer.',
      },
      {
        'icon': Icons.calendar_month,
        'titre': 'Suivi prénatal',
        'texte':
            'Respectez les rendez-vous recommandés par votre professionnel de santé.',
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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

          ListView.builder(
            itemCount: conseils.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              final conseil = conseils[index];

              return Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
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
                      child: Icon(
                        conseil['icon'] as IconData,
                        color: const Color(0xFFFF2D6F),
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            conseil['titre'] as String,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFD81B60),
                            ),
                          ),

                          const SizedBox(height: 3),

                          Text(
                            conseil['texte'] as String,
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
            },
          ),
        ],
      ),
    );
  }
}
