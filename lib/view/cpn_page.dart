import 'package:flutter/material.dart';

class CpnPage extends StatefulWidget {
  const CpnPage({super.key});

  @override
  State<CpnPage> createState() => _CpnPageState();
}

class _CpnPageState extends State<CpnPage> {
  // Numéros des consultations déjà effectuées.
  final Set<int> _completed = {1};

  static const _green = Color(0xFF36B77A);
  static const _pink = Color(0xFFF64E79);
  static const _purple = Color(0xFFAF91BF);
  static const _ink = Color(0xFF29252B);
  static const _muted = Color(0xFF817B84);

  static const List<_CpnVisit> _visits = [
    _CpnVisit(1, 'Avant 12 semaines', 'À programmer'),
    _CpnVisit(2, '14 – 20 semaines', 'À programmer'),
    _CpnVisit(3, '24 – 28 semaines', 'À programmer'),
    _CpnVisit(4, '28 – 32 semaines', 'À programmer'),
    _CpnVisit(5, '32 – 36 semaines', 'À programmer'),
    _CpnVisit(6, '36 – 38 semaines', 'À programmer'),
    _CpnVisit(7, '38 – 40 semaines', 'À programmer'),
    _CpnVisit(8, 'Après l’accouchement', '7 – 14 jours'),
  ];

  @override
  Widget build(BuildContext context) {
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
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 2, 22, 14),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    '8 consultations recommandées',
                    style: TextStyle(
                      color: _muted,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
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
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.touch_app_rounded, size: 14, color: _pink),
                      SizedBox(width: 5),
                      Text(
                        'Voir les détails',
                        style: TextStyle(
                          color: _pink,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Frise chronologique des huit consultations recommandées.
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 18),
              itemCount: _visits.length,
              itemBuilder: (context, index) {
                final visit = _visits[index];
                final done = _completed.contains(visit.number);
                final current =
                    !done &&
                    _visits
                        .take(index)
                        .every((v) => _completed.contains(v.number));
                final color = done
                    ? _green
                    : current
                    ? _pink
                    : _purple;
                return _TimelineTile(
                  visit: visit,
                  color: color,
                  done: done,
                  current: current,
                  isLast: index == _visits.length - 1,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => _CpnDetailPage(
                        visit: visit,
                        done: done,
                        onCompleted: () =>
                            setState(() => _completed.add(visit.number)),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CpnVisit {
  const _CpnVisit(this.number, this.weeks, this.date);
  final int number;
  final String weeks;
  final String date;
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({
    required this.visit,
    required this.color,
    required this.done,
    required this.current,
    required this.isLast,
    required this.onTap,
  });
  final _CpnVisit visit;
  final Color color;
  final bool done;
  final bool current;
  final bool isLast;
  final VoidCallback onTap;

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
                            'CPN ${visit.number}',
                            style: const TextStyle(
                              color: _CpnPageState._ink,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            visit.weeks,
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
                            child: const Text(
                              'En cours',
                              style: TextStyle(
                                color: _CpnPageState._pink,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          )
                        else
                          Text(
                            visit.date,
                            style: const TextStyle(
                              color: _CpnPageState._muted,
                              fontSize: 11,
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

class _CpnDetailPage extends StatefulWidget {
  const _CpnDetailPage({
    required this.visit,
    required this.done,
    required this.onCompleted,
  });
  final _CpnVisit visit;
  final bool done;
  final VoidCallback onCompleted;

  @override
  State<_CpnDetailPage> createState() => _CpnDetailPageState();
}

class _CpnDetailPageState extends State<_CpnDetailPage> {
  bool _marked = false;

  @override
  Widget build(BuildContext context) {
    final isDone = widget.done || _marked;
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
          'CPN ${widget.visit.number}',
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
              widget.visit.weeks,
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
                const Expanded(
                  child: Text(
                    'Date à confirmer avec le centre',
                    style: TextStyle(
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
                    isDone ? 'Effectuée' : 'À planifier',
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
          const SizedBox(height: 12),
          _DetailCard(
            title: 'Examens et soins',
            children: const [
              _CheckRow('Mesure de la tension artérielle'),
              _CheckRow('Contrôle du poids'),
              _CheckRow('Analyse d’urine'),
              _CheckRow('Dépistage : syphilis, VIH, hépatite B'),
              _CheckRow('Supplément en fer et acide folique'),
              _CheckRow('Conseil nutritionnel'),
            ],
          ),
          const SizedBox(height: 12),
          _DetailCard(
            title: 'À apporter',
            children: const [
              Text(
                'Carnet de santé',
                style: TextStyle(
                  color: Color(0xFF4E4850),
                  height: 1.45,
                  fontSize: 13,
                ),
              ),
              SizedBox(height: 5),
              Text(
                'Résultats d’analyses précédentes, si disponibles',
                style: TextStyle(
                  color: Color(0xFF4E4850),
                  height: 1.45,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: isDone
                  ? null
                  : () {
                      widget.onCompleted();
                      setState(() => _marked = true);
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF64E79),
                disabledBackgroundColor: const Color(0xFFB7DCC6),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: Text(
                isDone ? 'Consultation effectuée ✓' : 'Marquer comme effectuée',
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
  const _CheckRow(this.label, {this.note});
  final String label;
  final String? note;

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
              if (note != null)
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text(
                    note!,
                    style: const TextStyle(
                      color: Color(0xFF817B84),
                      fontSize: 11,
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
