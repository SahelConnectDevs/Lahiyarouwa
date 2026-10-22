import 'dart:async';

import 'package:flutter/material.dart';

class ContractionPage extends StatefulWidget {
  const ContractionPage({super.key});

  @override
  State<ContractionPage> createState() => _ContractionPageState();
}

class _ContractionPageState extends State<ContractionPage> {
  static const Color pink = Color(0xFFF34D68);
  static const Color ink = Color(0xFF25242A);
  static const Color muted = Color(0xFF777780);
  static const Color background = Color(0xFFFFFBFC);

  final Stopwatch _stopwatch = Stopwatch();

  final List<Duration> _lengths = [];
  final List<DateTime> _starts = [];

  Timer? _ticker;

  Duration _elapsed = Duration.zero;

  bool _running = false;
  bool _tracking = false;

  DateTime? _trackingStartedAt;

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  // ------------------------------------------------------------
  // DÉMARRER / ARRÊTER UNE CONTRACTION
  // ------------------------------------------------------------

  void _toggleContraction() {
    setState(() {
      // Première contraction du suivi
      if (!_tracking) {
        _tracking = true;
        _trackingStartedAt = DateTime.now();

        _lengths.clear();
        _starts.clear();
      }

      // Début de contraction
      if (!_running) {
        _running = true;

        _starts.add(DateTime.now());

        _stopwatch
          ..reset()
          ..start();

        _ticker?.cancel();

        _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
          if (mounted) {
            setState(() {
              _elapsed = _stopwatch.elapsed;
            });
          }
        });
      }
      // Fin de contraction
      else {
        _stopwatch.stop();

        _lengths.add(_stopwatch.elapsed);

        _elapsed = _stopwatch.elapsed;

        _running = false;

        _ticker?.cancel();
      }
    });
  }

  // ------------------------------------------------------------
  // EFFACER LES MESURES
  // ------------------------------------------------------------

  void _clearMeasurements() {
    setState(() {
      _ticker?.cancel();

      _stopwatch
        ..stop()
        ..reset();

      _elapsed = Duration.zero;

      _lengths.clear();
      _starts.clear();

      _running = false;
      _tracking = false;

      _trackingStartedAt = null;
    });
  }

  // ------------------------------------------------------------
  // TERMINER LE SUIVI
  // ------------------------------------------------------------

  void _endTracking() {
    if (_running) {
      _stopwatch.stop();

      _lengths.add(_stopwatch.elapsed);
    }

    setState(() {
      _ticker?.cancel();

      _stopwatch.reset();

      _elapsed = Duration.zero;

      _running = false;
      _tracking = false;

      _trackingStartedAt = null;
    });
  }

  // ------------------------------------------------------------
  // INFORMATIONS
  // ------------------------------------------------------------

  void _showInfo() {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          icon: const Icon(Icons.timer_rounded, color: pink, size: 30),
          title: const Text(
            'Compteur de contractions',
            textAlign: TextAlign.center,
          ),
          content: const Text(
            'Appuyez au début d’une contraction, puis à nouveau '
            'à sa fin. L’application mesure la durée de la contraction '
            'et estime l’intervalle entre les contractions.',
            textAlign: TextAlign.center,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Compris', style: TextStyle(color: pink)),
            ),
          ],
        );
      },
    );
  }

  // ------------------------------------------------------------
  // FORMATAGE DU TEMPS
  // ------------------------------------------------------------

  String _format(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');

    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');

    final hours = duration.inHours;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:$minutes:$seconds';
    }

    return '$minutes:$seconds';
  }

  // ------------------------------------------------------------
  // CALCULS
  // ------------------------------------------------------------

  Duration get _sinceStart {
    if (_trackingStartedAt == null) {
      return Duration.zero;
    }

    return DateTime.now().difference(_trackingStartedAt!);
  }

  Duration get _averageInterval {
    if (_starts.length < 2) {
      return Duration.zero;
    }

    int totalMilliseconds = 0;

    for (int i = 1; i < _starts.length; i++) {
      totalMilliseconds += _starts[i].difference(_starts[i - 1]).inMilliseconds;
    }

    return Duration(milliseconds: totalMilliseconds ~/ (_starts.length - 1));
  }

  Duration get _averageLength {
    if (_lengths.isEmpty) {
      return Duration.zero;
    }

    final totalMilliseconds = _lengths.fold<int>(
      0,
      (sum, duration) => sum + duration.inMilliseconds,
    );

    return Duration(milliseconds: totalMilliseconds ~/ _lengths.length);
  }

  // ------------------------------------------------------------
  // INTERFACE
  // ------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      children: [
        // --------------------------------------------------------
        // EN-TÊTE
        // --------------------------------------------------------

        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: pink.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.timer_rounded, color: pink),
            ),

            const SizedBox(width: 12),

            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Contractions',
                    style: TextStyle(
                      color: ink,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Suivez vos contractions simplement',
                    style: TextStyle(color: muted, fontSize: 12),
                  ),
                ],
              ),
            ),

            IconButton(
              tooltip: 'Informations',
              onPressed: _showInfo,
              icon: const Icon(Icons.info_outline_rounded, color: muted),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // --------------------------------------------------------
        // STATUT
        // --------------------------------------------------------
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: BoxDecoration(
            color: _running ? pink.withValues(alpha: 0.10) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _running
                  ? pink.withValues(alpha: 0.20)
                  : const Color(0xFFF1E7EA),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: _running ? pink : const Color(0xFFBDB8BC),
                  shape: BoxShape.circle,
                ),
              ),

              const SizedBox(width: 9),

              Text(
                _running
                    ? 'Contraction en cours'
                    : _tracking
                    ? 'Suivi en cours'
                    : 'Prêt à commencer',
                style: const TextStyle(
                  color: ink,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // --------------------------------------------------------
        // COMPTEUR PRINCIPAL
        // --------------------------------------------------------
        Container(
          padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1E7EA)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.035),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                _format(_elapsed),
                style: const TextStyle(
                  color: ink,
                  fontSize: 46,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),

              const SizedBox(height: 4),

              const Text(
                'Durée de la contraction',
                style: TextStyle(color: muted, fontSize: 12),
              ),

              const SizedBox(height: 20),

              Container(height: 1, width: 60, color: const Color(0xFFEFE7EA)),

              const SizedBox(height: 18),

              Text(
                _format(_sinceStart),
                style: const TextStyle(
                  color: ink,
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 4),

              const Text(
                'Depuis le début du suivi',
                style: TextStyle(color: muted, fontSize: 12),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // --------------------------------------------------------
        // STATISTIQUES
        // --------------------------------------------------------
        Row(
          children: [
            Expanded(
              child: _StatisticCard(
                icon: Icons.sync_rounded,
                title: 'Intervalle moyen',
                value: _format(_averageInterval),
              ),
            ),

            const SizedBox(width: 10),

            Expanded(
              child: _StatisticCard(
                icon: Icons.timer_outlined,
                title: 'Durée moyenne',
                value: _format(_averageLength),
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // --------------------------------------------------------
        // BOUTON PRINCIPAL
        // --------------------------------------------------------
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton.icon(
            onPressed: _toggleContraction,
            icon: Icon(
              _running ? Icons.stop_rounded : Icons.play_arrow_rounded,
              color: Colors.white,
            ),
            label: Text(
              _running
                  ? 'Terminer la contraction'
                  : 'Commencer une contraction',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: pink,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),

        // --------------------------------------------------------
        // ACTIONS
        // --------------------------------------------------------
        if (_tracking) ...[
          const SizedBox(height: 10),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _clearMeasurements,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Réinitialiser'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: pink,
                    side: const BorderSide(color: Color(0xFFF5D5DD)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _endTracking,
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('Terminer'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ink,
                    side: const BorderSide(color: Color(0xFFE8E1E4)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],

        const SizedBox(height: 12),

        // --------------------------------------------------------
        // SIGNALEMENT
        // --------------------------------------------------------
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const SignalerSignePage(),
                ),
              );
            },
            icon: const Icon(Icons.warning_amber_rounded, size: 19),
            label: const Text('Signaler un signe inquiétant'),
            style: OutlinedButton.styleFrom(
              foregroundColor: pink,
              side: const BorderSide(color: Color(0xFFF5D5DD)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),

        const SizedBox(height: 16),

        const Text(
          'Les mesures sont indicatives et ne remplacent pas '
          'l’avis d’un professionnel de santé.',
          textAlign: TextAlign.center,
          style: TextStyle(color: muted, fontSize: 11, height: 1.4),
        ),
      ],
    );
  }
}

// ===================================================================
// CARTE STATISTIQUE
// ===================================================================

class _StatisticCard extends StatelessWidget {
  const _StatisticCard({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: const Color(0xFFF1E7EA)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 19, color: const Color(0xFFF34D68)),

          const SizedBox(height: 7),

          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF55525A), fontSize: 11),
          ),

          const SizedBox(height: 7),

          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF29272D),
              fontSize: 19,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ===================================================================
// PAGE : SIGNALER UN SIGNE
// ===================================================================

class SignalerSignePage extends StatefulWidget {
  const SignalerSignePage({super.key});

  @override
  State<SignalerSignePage> createState() => _SignalerSignePageState();
}

class _SignalerSignePageState extends State<SignalerSignePage> {
  static const Color pink = Color(0xFFF34D68);

  static const List<String> signes = [
    'Saignement vaginal',
    'Forte fièvre',
    'Maux de tête sévères',
    'Vision trouble',
    'Douleur abdominale intense',
    'Absence de mouvements du bébé',
    'Perte de liquide',
    'Convulsions',
    'Autre signe',
  ];

  String? selected;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFBFC),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Signaler un signe',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),

      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          const Text(
            'Quel signe ressentez-vous ?',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF25242A),
            ),
          ),

          const SizedBox(height: 12),

          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFF1E7EA)),
            ),
            child: Column(
              children: [
                for (final signe in signes)
                  ListTile(
                    onTap: () {
                      setState(() {
                        selected = signe;
                      });
                    },
                    leading: Icon(
                      selected == signe
                          ? Icons.radio_button_checked
                          : Icons.radio_button_off,
                      color: selected == signe ? pink : const Color(0xFF9A949A),
                    ),
                    title: Text(signe, style: const TextStyle(fontSize: 13)),
                    dense: true,
                  ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: selected == null
                  ? null
                  : () {
                      showDialog<void>(
                        context: context,
                        builder: (dialogContext) {
                          return AlertDialog(
                            icon: const Icon(
                              Icons.health_and_safety_rounded,
                              color: pink,
                            ),
                            title: const Text('Signe sélectionné'),
                            content: Text(
                              '$selected.\n\n'
                              'Contactez rapidement votre centre '
                              'de santé ou un professionnel.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext);
                                },
                                child: const Text(
                                  'Compris',
                                  style: TextStyle(color: pink),
                                ),
                              ),
                            ],
                          );
                        },
                      );
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: pink,
                disabledBackgroundColor: const Color(0xFFF2C7D0),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Signaler',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
