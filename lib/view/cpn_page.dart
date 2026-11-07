import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/dates.dart';
import '../features/grossesse/data/models/cpn_visit_model.dart';
import '../features/grossesse/providers/grossesse_provider.dart';
import 'ddr_page.dart';

class CpnPage extends StatefulWidget {
  const CpnPage({super.key});

  @override
  State<CpnPage> createState() => _CpnPageState();
}

class _CpnPageState extends State<CpnPage> {
  static const _green = Color(0xFF36B77A);
  static const _pink = Color(0xFFF64E79);
  static const _orange = Color(0xFFE8833A);
  static const _purple = Color(0xFFAF91BF);
  static const _ink = Color(0xFF29252B);
  static const _muted = Color(0xFF817B84);

  static Color colorFor(CpnVisitModel visit, {required bool isNext}) =>
      switch (visit.statut) {
        CpnStatus.effectuee => _green,
        CpnStatus.enRetard => _orange,
        _ when isNext => _pink,
        _ => _purple,
      };

  @override
  Widget build(BuildContext context) {
    final grossesse = context.watch<GrossesseProvider>();
    final visits = grossesse.cpn;
    final next = grossesse.nextCpn;

    return Scaffold(
      backgroundColor: const Color(0xFFFFFCFD),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Calendrier des CPN',
          style: TextStyle(
            color: _ink,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: !grossesse.hasPregnancy
          ? const _NoPregnancy()
          : RefreshIndicator(
              color: _pink,
              onRefresh: grossesse.load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 100),
                itemCount: visits.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _Header(
                      done: grossesse.cpnDoneCount,
                      total: visits.length,
                    );
                  }
                  final visit = visits[index - 1];
                  final isNext = visit.numero == next?.numero;
                  return _TimelineTile(
                    visit: visit,
                    color: colorFor(visit, isNext: isNext),
                    current: isNext,
                    isLast: index == visits.length,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => _CpnDetailPage(numero: visit.numero),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.done, required this.total});

  final int done;
  final int total;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(8, 2, 8, 14),
    child: Row(
      children: [
        Expanded(
          child: Text(
            '$total consultations recommandées · $done effectuée${done > 1 ? 's' : ''}',
            style: const TextStyle(
              color: _CpnPageState._muted,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF0F4),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.touch_app_rounded,
                size: 14,
                color: _CpnPageState._pink,
              ),
              SizedBox(width: 5),
              Text(
                'Voir les détails',
                style: TextStyle(
                  color: _CpnPageState._pink,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

/// Affiché tant qu'aucune grossesse n'est déclarée (DDR « Plus tard »).
class _NoPregnancy extends StatelessWidget {
  const _NoPregnancy();

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.calendar_month_rounded,
            size: 56,
            color: _CpnPageState._pink,
          ),
          const SizedBox(height: 14),
          const Text(
            'Indiquez la date de vos dernières règles pour obtenir votre '
            'calendrier de consultations prénatales.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _CpnPageState._muted, height: 1.4),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(builder: (_) => const DdrPage()),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _CpnPageState._pink,
              foregroundColor: Colors.white,
            ),
            child: const Text('Renseigner la date'),
          ),
        ],
      ),
    ),
  );
}

/// Date ou statut affiché à droite d'une CPN de la frise.
String _whenLabel(CpnVisitModel visit) {
  if (visit.effectueeLe != null) return Dates.short(visit.effectueeLe!);
  final debut = visit.fenetreDebut;
  if (debut == null) return 'Après l’accouchement';
  if (visit.statut == CpnStatus.enRetard) return 'En retard';
  return 'À partir du ${Dates.short(debut)}';
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({
    required this.visit,
    required this.color,
    required this.current,
    required this.isLast,
    required this.onTap,
  });
  final CpnVisitModel visit;
  final Color color;
  final bool current;
  final bool isLast;
  final VoidCallback onTap;

  bool get done => visit.isDone;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 86,
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: 28,
          child: Stack(
            alignment: Alignment.topCenter,
            children: [
              if (!isLast)
                Positioned(
                  top: 19,
                  bottom: 0,
                  child: Container(width: 2, color: const Color(0xFFE6DDE8)),
                ),
              Positioned(
                top: 15,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: done ? color : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: color, width: 2),
                  ),
                  child: done
                      ? const Icon(Icons.check, size: 13, color: Colors.white)
                      : null,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 5),
        Expanded(
          child: Material(
            color: current ? const Color(0xFFFFF0F4) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            elevation: current ? 1.5 : 0,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: current
                        ? const Color(0xFFF8D7E2)
                        : const Color(0xFFF1EDF1),
                  ),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'CPN ${visit.numero}',
                            style: const TextStyle(
                              color: _CpnPageState._ink,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            visit.periode,
                            style: const TextStyle(
                              color: _CpnPageState._muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (done)
                          Text(
                            '✓ Effectuée',
                            style: TextStyle(
                              color: color,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          )
                        else if (current)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Text(
                              visit.statut == CpnStatus.enRetard
                                  ? 'En retard'
                                  : visit.statut == CpnStatus.enCours
                                  ? 'En cours'
                                  : 'Prochaine',
                              style: TextStyle(
                                color: color,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          )
                        else
                          Text(
                            _whenLabel(visit),
                            style: TextStyle(
                              color: visit.statut == CpnStatus.enRetard
                                  ? color
                                  : _CpnPageState._muted,
                              fontSize: 11,
                              fontWeight: visit.statut == CpnStatus.enRetard
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        if (current)
                          const Padding(
                            padding: EdgeInsets.only(top: 3),
                            child: Text(
                              'Touchez pour le détail',
                              style: TextStyle(
                                color: _CpnPageState._muted,
                                fontSize: 10,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _CpnDetailPage extends StatelessWidget {
  const _CpnDetailPage({required this.numero});

  final int numero;

  Future<void> _toggle(BuildContext context, CpnVisitModel visit) async {
    final grossesse = context.read<GrossesseProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final ok = await grossesse.markCpn(numero, effectuee: !visit.isDone);
    if (!ok) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(grossesse.errorMessage ?? 'Échec de l’enregistrement.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final grossesse = context.watch<GrossesseProvider>();
    final visit = grossesse.cpn.where((v) => v.numero == numero).firstOrNull;
    if (visit == null) return const Scaffold();
    final isDone = visit.isDone;
    final debut = visit.fenetreDebut;
    final fin = visit.fenetreFin;

    return Scaffold(
      backgroundColor: const Color(0xFFFFFCFD),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF29252B)),
        ),
        title: Text(
          'CPN ${visit.numero}',
          style: const TextStyle(
            color: Color(0xFF29252B),
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
        children: [
          Center(
            child: Text(
              '${visit.titre} · ${visit.periode}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF29252B),
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1EAF0)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_month_outlined,
                  color: Color(0xFF8E8790),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isDone && visit.effectueeLe != null
                        ? 'Effectuée le ${Dates.long(visit.effectueeLe!)}'
                        : debut != null && fin != null
                        ? 'Entre le ${Dates.short(debut)} et le ${Dates.short(fin)}'
                        : 'Date à confirmer avec le centre',
                    style: const TextStyle(
                      color: Color(0xFF29252B),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF0F4),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(
                    switch (visit.statut) {
                      CpnStatus.effectuee => 'Effectuée',
                      CpnStatus.enCours => 'En cours',
                      CpnStatus.enRetard => 'En retard',
                      CpnStatus.aVenir => 'À venir',
                    },
                    style: const TextStyle(
                      color: Color(0xFFF64E79),
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (visit.examens.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailCard(
              title: 'Examens et soins',
              children: [for (final e in visit.examens) _CheckRow(e)],
            ),
          ],
          if (visit.aApporter.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailCard(
              title: 'À apporter',
              children: [
                for (final item in visit.aApporter)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 5),
                    child: Text(
                      item,
                      style: const TextStyle(
                        color: Color(0xFF4E4850),
                        height: 1.45,
                        fontSize: 13,
                      ),
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 18),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: grossesse.isSaving
                  ? null
                  : () => _toggle(context, visit),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDone
                    ? const Color(0xFF8FCBA9)
                    : const Color(0xFFF64E79),
                disabledBackgroundColor: const Color(0xFFE5C9D2),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: grossesse.isSaving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      isDone
                          ? 'Effectuée ✓ — annuler'
                          : 'Marquer comme effectuée',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Calendrier indicatif. Demandez conseil à votre professionnel de santé.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF817B84), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(15, 14, 15, 13),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(19),
      border: Border.all(color: const Color(0xFFF1EAF0)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.025),
          blurRadius: 9,
          offset: const Offset(0, 3),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF29252B),
            fontWeight: FontWeight.bold,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        ...children,
      ],
    ),
  );
}

class _CheckRow extends StatelessWidget {
  const _CheckRow(this.label);
  final String label;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.check_circle_outline,
          color: Color(0xFF47B77D),
          size: 19,
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF38333A),
                  fontSize: 12.5,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
