import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class TabMamanWidget extends StatelessWidget {
  const TabMamanWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image

          // Progression
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                const Text(
                  'Votre progression',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF55515A),
                  ),
                ),

                SizedBox(
                  height: 220,
                  width: 220,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      PieChart(
                        PieChartData(
                          centerSpaceRadius: 65,
                          sectionsSpace: 0,
                          startDegreeOffset: -90,
                          sections: [
                            PieChartSectionData(
                              value: 60,
                              color: const Color(0xFFFF2D6F),
                              radius: 17,
                              title: '',
                            ),
                            PieChartSectionData(
                              value: 40,
                              color: const Color(0xFFEFE7EB),
                              radius: 17,
                              title: '',
                            ),
                          ],
                        ),
                      ),

                      const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '2ᵉ trimestre',
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                          Text(
                            '24 SA + 3 j',
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.bold,
                            ),
                          ),

                          SizedBox(height: 3),
                          Text(
                            '60 %',
                            style: TextStyle(
                              fontSize: 23,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFD81B60),
                            ),
                          ),
                          Text(
                            'de parcours',
                            style: TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SizedBox(
              width: double.infinity,
              height: 230,
              child: Image.asset('assets/fem1.png', fit: BoxFit.cover),
            ),
          ),

          const SizedBox(height: 20),

          const Text(
            'Les changements cette semaine',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFFD81B60),
            ),
          ),

          const SizedBox(height: 10),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: changements.length,
            itemBuilder: (context, index) {
              final item = changements[index];

              return Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 7),
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: const Color(0xFFFFE0EA)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFE6EF),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        item.icon,
                        size: 19,
                        color: const Color(0xFFFF2D6F),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Expanded(
                      child: Text(
                        item.texte,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF55515A),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 8),

          _box(
            'Bon à savoir',
            'Ces changements peuvent varier d’une femme à l’autre. '
                'Chaque grossesse est unique.',
          ),
        ],
      ),
    );
  }
}

Widget _box(String titre, String texte) {
  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFFFEAF2),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titre,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFFD81B60),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          texte,
          style: const TextStyle(
            fontSize: 11,
            height: 1.4,
            color: Color(0xFF665B62),
          ),
        ),
      ],
    ),
  );
}

class Changement {
  final IconData icon;
  final String texte;

  const Changement(this.icon, this.texte);
}

const changements = [
  Changement(Icons.pregnant_woman, 'Votre ventre est plus visible.'),
  Changement(Icons.favorite_border, 'Vos seins peuvent être plus sensibles.'),
  Changement(
    Icons.accessibility_new,
    'Des crampes dans les jambes peuvent survenir.',
  ),
  Changement(Icons.mood, 'Des variations d’humeur sont possibles.'),
  Changement(Icons.bedtime, 'Vous pouvez ressentir plus de fatigue.'),
];
