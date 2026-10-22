import 'package:flutter/material.dart';
import '../models/vaccin_model_page.dart';
import '../widgets/menu_card_widget.dart';
import '../models/cpn_model_page.dart';
import '../widgets/info_card_widget.dart';
import '../widgets/drawer_widegt.dart';
import 'tab_bar_page.dart';

class AccueilPage extends StatefulWidget {
  const AccueilPage({super.key});

  @override
  State<AccueilPage> createState() => _AccueilPageState();
}

class _AccueilPageState extends State<AccueilPage> {
  String nom = 'Zamzam';
  int semaine = 12;
  int jours = 5;
  int trimestre = 3;
  final DateTime ddr = DateTime(2026, 1, 1);
  final CpnModelPage cpn = CpnModelPage(
    nbreDuCpn: 2,
    nbreDuJour: 8,
    dateDuCpn: 'Vendredi le 4 Aout 2026',
  );
  final VaccinModelPage vaccin = VaccinModelPage(
    nom: 'Tétanos',
    dateVaccin: DateTime(2026, 9, 15),
    joursRestants: 9,
    description: 'Vaccination recommandée pendant la grossesse.',
  );
  var hydratation =
      'Pensez à boire régulièrement de l’eau tout au long de la journée.';

  var question = 'Avez-vous bien dormi cette nuit ?';

  var recommandation =
      'Privilégiez les fruits, légumes et aliments riches en fer.';

  var information = 'Votre bébé poursuit son développement cette semaine.';

  var conseil = 'Prenez quelques minutes pour vous reposer et vous détendre.';
  @override
  Widget build(BuildContext context) {
    final DateTime dpa = ddr.add(const Duration(days: 280));
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Bonjour, $nom',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),

            SizedBox(height: 5),
            Text(
              ' ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: Icon(Icons.notifications_rounded),
            color: Colors.yellow,
          ),
        ],
      ),

      drawer: DrawerWidget(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              height: 190,
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE91663), Color(0xFFFF7189)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),

              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),

                child: Stack(
                  children: [
                    // =========================
                    // 💗 DÉCORATIONS
                    // =========================
                    Positioned(
                      right: 175,
                      top: 25,
                      child: Icon(
                        Icons.favorite_rounded,
                        size: 17,
                        color: Colors.white.withValues(alpha: 0.20),
                      ),
                    ),

                    Positioned(
                      right: 195,
                      top: 50,
                      child: Icon(
                        Icons.favorite_rounded,
                        size: 27,
                        color: Colors.white.withValues(alpha: 0.28),
                      ),
                    ),

                    Positioned(
                      right: 155,
                      top: 65,
                      child: Icon(
                        Icons.favorite_rounded,
                        size: 10,
                        color: Colors.white.withValues(alpha: 0.30),
                      ),
                    ),

                    Positioned(
                      right: -25,
                      top: -30,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),

                    Positioned(
                      right: 25,
                      bottom: -50,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(14),

                      child: Row(
                        children: [
                          // =========================
                          // PARTIE GAUCHE
                          // =========================
                          Expanded(
                            flex: 6,

                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,

                              children: [
                                const Text(
                                  'Vous êtes à',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),

                                const SizedBox(height: 2),

                                // SEMAINE
                                Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,

                                  children: [
                                    Text(
                                      '$semaine',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 38,
                                        fontWeight: FontWeight.bold,
                                        height: 1,
                                      ),
                                    ),

                                    const SizedBox(width: 6),

                                    Flexible(
                                      child: Text(
                                        'SA + $jours jours',
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 4),

                                // TRIMESTRE
                                Text(
                                  '$trimestreème trimestre',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(height: 8),

                                // =========================
                                // PROGRESSION
                                // =========================
                                SizedBox(
                                  width: 135,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,

                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(10),

                                        child: LinearProgressIndicator(
                                          value: (semaine / 40).clamp(0.0, 1.0),

                                          minHeight: 5,

                                          backgroundColor: Colors.white
                                              .withValues(alpha: 0.25),

                                          valueColor:
                                              const AlwaysStoppedAnimation<
                                                Color
                                              >(Colors.white),
                                        ),
                                      ),

                                      const SizedBox(height: 3),

                                      Text(
                                        '${((semaine / 40) * 100).round()} % du parcours',
                                        style: TextStyle(
                                          color: Colors.white.withValues(
                                            alpha: 0.80,
                                          ),
                                          fontSize: 8,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 7),

                                // =========================
                                // DPA
                                // =========================
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.calendar_month_rounded,
                                      color: Colors.white,
                                      size: 16,
                                    ),

                                    const SizedBox(width: 5),

                                    Flexible(
                                      child: Text(
                                        'DPA : '
                                        '${dpa.day.toString().padLeft(2, '0')}/'
                                        '${dpa.month.toString().padLeft(2, '0')}/'
                                        '${dpa.year}',

                                        overflow: TextOverflow.ellipsis,

                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 2),

                                Text(
                                  'Il vous reste ${40 - semaine} semaines',

                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.75),
                                    fontSize: 8,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // =========================
                          // PARTIE BÉBÉ
                          // =========================
                          Expanded(
                            flex: 4,

                            child: Align(
                              alignment: Alignment.center,

                              child: Image.asset(
                                'assets/img_bebe.png',

                                width: 140,
                                height: 140,

                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // =========================
                    // PETIT MESSAGE
                    // =========================
                    Positioned(
                      right: 8,
                      bottom: 8,

                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 80),

                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 5,
                        ),

                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(8),
                        ),

                        child: const Text(
                          'Votre bébé\n'
                          'grandit bien 💗',

                          textAlign: TextAlign.center,

                          style: TextStyle(
                            color: Color(0xFF555555),
                            fontSize: 7,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    MatherInfoPage(initialIndex: 0),
                              ),
                            );
                          },
                          child: MenuCardWidget(
                            icon: Icons.pregnant_woman_rounded,
                            title: 'Bébé',
                            subtitle: 'Votre santé',
                            onTap: () {},
                          ),
                        ),
                      ),

                      const SizedBox(width: 10),

                      Expanded(
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    MatherInfoPage(initialIndex: 1),
                              ),
                            );
                          },
                          child: MenuCardWidget(
                            icon: Icons.child_care_rounded,
                            title: 'Maman',
                            subtitle: 'Son développement',
                            onTap: () {},
                          ),
                        ),
                      ),

                      const SizedBox(width: 10),

                      Expanded(
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    MatherInfoPage(initialIndex: 2),
                              ),
                            );
                          },
                          child: MenuCardWidget(
                            icon: Icons.lightbulb_rounded,
                            title: 'Conseils',
                            subtitle: 'Pour vous',
                            onTap: () {},
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: InfoCardWidget(
                          title: 'Prochain CPN',
                          icon: Icons.calendar_month_rounded,
                          iconColor: const Color(0xFFD81B60),
                          info1: 'CPN : ${cpn.nbreDuCpn}',
                          info2: 'Dans ${cpn.nbreDuJour} jours',
                          info3: cpn.dateDuCpn,
                          onTap: () {},
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: InfoCardWidget(
                          title: 'Prochain vaccin',
                          icon: Icons.vaccines_rounded,
                          iconColor: const Color(0xFFD81B60),
                          info1: vaccin.nom,
                          info2: 'Dans ${vaccin.joursRestants} jours',
                          info3:
                              '${vaccin.dateVaccin.day} ${vaccin.dateVaccin.month} ${vaccin.dateVaccin.year}',
                          onTap: () {},
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Aujourd'hui",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      // 1
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEDEDED)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.water_drop_rounded,
                              color: Colors.blue,
                            ),

                            const SizedBox(width: 12),

                            Expanded(
                              child: Text(
                                hydratation,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),

                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // 2
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEDEDED)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.favorite_rounded,
                              color: Color(0xFFD81B60),
                            ),

                            const SizedBox(width: 12),

                            Expanded(
                              child: Text(
                                question,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),

                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // 3
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEDEDED)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.restaurant_rounded,
                              color: Color(0xFF66A84F),
                            ),

                            const SizedBox(width: 12),

                            Expanded(
                              child: Text(
                                recommandation,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),

                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // 4
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEDEDED)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.child_care_rounded,
                              color: Color(0xFFFF9F43),
                            ),

                            const SizedBox(width: 12),

                            Expanded(
                              child: Text(
                                information,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),

                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // 5
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEDEDED)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.self_improvement_rounded,
                              color: Color(0xFF9C6ADE),
                            ),

                            const SizedBox(width: 12),

                            Expanded(
                              child: Text(
                                conseil,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),

                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
