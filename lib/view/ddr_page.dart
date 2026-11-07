import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/dates.dart';
import '../features/grossesse/providers/grossesse_provider.dart';
import '../widgets/error_banner_widget.dart';

/// Saisie de la date des dernières règles (DDR).
///
/// Affichée par `_AppRoot` (main.dart) tant qu'aucune grossesse n'est
/// déclarée, ou ouverte depuis l'accueil pour corriger la date. Une fois la
/// DDR enregistrée, l'API calcule semaines, trimestre, terme et CPN.
class DdrPage extends StatefulWidget {
  const DdrPage({super.key});

  @override
  State<DdrPage> createState() => _DdrPageState();
}

class _DdrPageState extends State<DdrPage> {
  static const _pink = Color(0xFFD81B60);

  late DateTime _selected;
  late final DateTime _firstDate;
  late final DateTime _lastDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _lastDate = DateTime(now.year, now.month, now.day);
    // L'API refuse une DDR de plus de 44 semaines.
    _firstDate = _lastDate.subtract(const Duration(days: 44 * 7 - 1));
    final current = context.read<GrossesseProvider>().pregnancy?.ddr;
    _selected = current != null && !current.isBefore(_firstDate)
        ? DateTime(current.year, current.month, current.day)
        : _lastDate.subtract(const Duration(days: 8 * 7));
  }

  Future<void> _save() async {
    final grossesse = context.read<GrossesseProvider>();
    final navigator = Navigator.of(context);
    final ok = await grossesse.setDdr(_selected);
    // Ouverte depuis l'accueil : on revient en arrière. Affichée par
    // _AppRoot : l'app s'ouvre d'elle-même dès que la grossesse existe.
    if (ok && navigator.canPop()) navigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    final grossesse = context.watch<GrossesseProvider>();
    final pushed = Navigator.of(context).canPop();
    final elapsed = _lastDate.difference(_selected).inDays;
    final terme = _selected.add(const Duration(days: 280));

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: pushed,
        title: const Text(
          'Date des dernières règles',
          style: TextStyle(
            color: _pink,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          if (!pushed)
            TextButton(
              onPressed: grossesse.isSaving ? null : grossesse.skipDdr,
              child: const Text('Plus tard', style: TextStyle(color: _pink)),
            ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            const SizedBox(height: 4),
            const Text(
              'Indiquez le premier jour de vos dernières règles.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1D9E3)),
              ),
              child: CalendarDatePicker(
                initialDate: _selected,
                firstDate: _firstDate,
                lastDate: _lastDate,
                onDateChanged: (date) => setState(() => _selected = date),
              ),
            ),
            const SizedBox(height: 10),
            _InfoCard(
              title: '${elapsed ~/ 7} SA + ${elapsed % 7} j',
              text:
                  'Avec cette date, le terme est estimé au '
                  '${Dates.long(terme)}. Votre professionnel de santé '
                  'pourra l’ajuster après l’échographie.',
            ),
            const SizedBox(height: 10),
            if (grossesse.errorMessage != null) ...[
              ErrorBannerWidget(message: grossesse.errorMessage!),
              const SizedBox(height: 10),
            ],
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: grossesse.isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _pink,
                  disabledBackgroundColor: const Color(0xFFE891B2),
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
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
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Enregistrer',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(width: 10),
                          Icon(Icons.arrow_forward, size: 18),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.text});

  final String title;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF5F8),
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFF8D5E2)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: const Color(0xFFD81B60),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.info_outline_rounded,
            color: Colors.white,
            size: 24,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFFD81B60),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                text,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
