import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/dates.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/conseils/providers/conseil_provider.dart';
import '../features/grossesse/data/models/cpn_visit_model.dart';
import '../features/grossesse/providers/grossesse_provider.dart';
import '../features/vaccination/providers/vaccination_provider.dart';
import '../widgets/drawer_widegt.dart';
import '../widgets/fetus_widget.dart';
import '../widgets/info_card_widget.dart';
import '../widgets/menu_card_widget.dart';
import 'ddr_page.dart';
import 'tab_bar_page.dart';

class AccueilPage extends StatefulWidget {
  const AccueilPage({super.key});

  @override
  State<AccueilPage> createState() => _AccueilPageState();
}

class _AccueilPageState extends State<AccueilPage> {
  static const _defaultConseil =
      'Prenez quelques minutes pour vous reposer et vous détendre.';

  var hydratation =
      'Pensez à boire régulièrement de l’eau tout au long de la journée.';

  var question = 'Avez-vous bien dormi cette nuit ?';

  var recommandation =
      'Privilégiez les fruits, légumes et aliments riches en fer.';

  var information = 'Votre bébé poursuit son développement cette semaine.';

  Future<void> _refresh() async {
    final grossesse = context.read<GrossesseProvider>();
    final conseils = context.read<ConseilProvider>();
    final vaccination = context.read<VaccinationProvider>();
    await Future.wait([grossesse.load(), vaccination.load()]);
    await conseils.load(semaine: grossesse.pregnancy?.semaine);
  }

  /// « Dans 8 jours », « En cours », « En retard »… pour la prochaine CPN.
  String _cpnWhen(CpnVisitModel? visit) {
    if (visit == null) return 'Toutes effectuées';
    final debut = visit.fenetreDebut;
    switch (visit.statut) {
      case CpnStatus.enRetard:
        return 'En retard';
      case CpnStatus.enCours:
        return 'À faire maintenant';
      default:
        if (debut == null) return 'Après l’accouchement';
        final days = Dates.daysFromToday(debut);
        return days <= 0 ? 'À faire maintenant' : 'Dans $days jours';
    }
  }

  @override
  Widget build(BuildContext context) {
    final nom = context.watch<AuthProvider>().firstName;
    final grossesse = context.watch<GrossesseProvider>();
    final vaccination = context.watch<VaccinationProvider>();
    final conseil =
        context.watch<ConseilProvider>().conseilDuJour()?.contenu ??
        _defaultConseil;
    final pregnancy = grossesse.pregnancy;
    final semaine = pregnancy?.semaine ?? 0;
    final jours = pregnancy?.jour ?? 0;
    final trimestre = pregnancy?.trimestre ?? 1;
    final dpa = pregnancy?.termePrevu ?? DateTime.now();
    final nextCpn = grossesse.nextCpn;
    final nextVaccin = vaccination.next;
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
      body: RefreshIndicator(
        color: const Color(0xFFD81B60),
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 90),
          child: Column(
            children: [
              if (pregnancy == null)
                const _NoPregnancyCard()
              else
                Container(
                  width: double.infinity,
                  height: 190,
                  margin: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
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
                                      trimestre == 1
                                          ? '1er trimestre'
                                          : '${trimestre}e trimestre',
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
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),

                                            child: LinearProgressIndicator(
                                              value: (semaine / 40).clamp(
                                                0.0,
                                                1.0,
                                              ),

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
                                      'Il vous reste ${pregnancy.semainesRestantes} semaines',

                                      style: TextStyle(
                                        color: Colors.white.withValues(
                                          alpha: 0.75,
                                        ),
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

                                  // Grandit avec le bébé (taille moyenne à la semaine).
                                  child: FetusWidget(
                                    echelle: grossesse.fetalSize?.echelle ?? 1,
                                    size: 140,
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

                            child: Text(
                              '${grossesse.fetalSize?.tailleLabel ?? ''}\n'
                              '${grossesse.fetalSize?.poidsLabel ?? ''} 💗',

                              textAlign: TextAlign.center,

                              style: const TextStyle(
                                color: Color(0xFF555555),
                                fontSize: 8,
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
                            info1: nextCpn != null
                                ? 'CPN ${nextCpn.numero}'
                                : 'CPN',
                            info2: pregnancy == null
                                ? 'DDR à renseigner'
                                : _cpnWhen(nextCpn),
                            info3: nextCpn?.fenetreDebut != null
                                ? Dates.long(nextCpn!.fenetreDebut!)
                                : nextCpn?.periode ?? '—',
                            onTap: () {},
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: InfoCardWidget(
                            title: 'Prochain vaccin',
                            icon: Icons.vaccines_rounded,
                            iconColor: const Color(0xFFD81B60),
                            info1: nextVaccin?.nom ?? 'À jour',
                            info2: nextVaccin == null
                                ? 'Aucun vaccin en attente'
                                : nextVaccin.dose ?? 'À faire',
                            info3: nextVaccin?.moment ?? '—',
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
      ),
    );
  }
}

/// Carte affichée à la place du compteur de semaines tant qu'aucune
/// grossesse n'est déclarée (DDR « Plus tard » ou grossesse terminée).
class _NoPregnancyCard extends StatelessWidget {
  const _NoPregnancyCard();

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFFE91663), Color(0xFFFF7189)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Suivi de grossesse',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Indiquez la date de vos dernières règles pour suivre l’évolution '
          'de votre grossesse et recevoir votre calendrier de CPN.',
          style: TextStyle(color: Colors.white, fontSize: 12, height: 1.4),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute<void>(builder: (_) => const DdrPage()),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFFD81B60),
          ),
          child: const Text('Renseigner la date'),
        ),
      ],
    ),
  );
}
