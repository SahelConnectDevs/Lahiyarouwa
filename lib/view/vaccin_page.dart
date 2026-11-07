import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/dates.dart';
import '../core/utils/load_status.dart';
import '../features/vaccination/data/models/vaccine_entry_model.dart';
import '../features/vaccination/providers/vaccination_provider.dart';

/// Onglet « Vaccin » : calendrier vaccinal de la maman, servi par l'API
/// (contenu géré depuis l'admin-web) avec les doses déjà enregistrées.
class VaccinPage extends StatelessWidget {
  const VaccinPage({super.key});

  static const _green = Color(0xFF278451);
  static const _darkGreen = Color(0xFF174B32);
  static const _muted = Color(0xFF7C8981);

  Future<void> _recordDose(
    BuildContext context,
    VaccineEntryModel entry,
  ) async {
    final provider = context.read<VaccinationProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      helpText: 'Date de la dose : ${entry.nom}',
      initialDate: now,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
    );
    if (date == null) return;
    final ok = await provider.recordDose(entry.vaccinId, date);
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(
          ok
              ? 'Dose enregistrée : ${entry.nom}'
              : provider.errorMessage ?? 'Échec de l’enregistrement.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vaccination = context.watch<VaccinationProvider>();
    final calendar = vaccination.calendar;

    return Scaffold(
      backgroundColor: const Color(0xFFF7FBF8),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Mes vaccins',
          style: TextStyle(color: _darkGreen, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        color: _green,
        onRefresh: vaccination.load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 100),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF57B77B), Color(0xFF23804C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: _green.withValues(alpha: 0.2),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  CircleAvatar(
                    radius: 27,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.health_and_safety_rounded,
                      color: _green,
                      size: 30,
                    ),
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Votre santé, notre priorité',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Gardez un œil sur vos vaccins et rappels.',
                          style: TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _SummaryTile(
                    icon: Icons.check_circle_rounded,
                    value: '${vaccination.doneCount}',
                    label: vaccination.doneCount > 1 ? 'Effectués' : 'Effectué',
                    color: _green,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryTile(
                    icon: Icons.event_available_rounded,
                    value: '${vaccination.pendingCount}',
                    label: 'À suivre',
                    color: const Color(0xFFDF9D35),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 25),
            const Text(
              'Mon calendrier vaccinal',
              style: TextStyle(
                color: _darkGreen,
                fontSize: 19,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            if (vaccination.status == LoadStatus.loading && calendar.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: _green)),
              )
            else if (vaccination.status == LoadStatus.error && calendar.isEmpty)
              _LoadErrorCard(
                message: vaccination.errorMessage,
                onRetry: vaccination.load,
              )
            else
              for (final entry in calendar) ...[
                _VaccinCard(
                  name: entry.nom,
                  dose: entry.dose ?? 'Dose',
                  date: entry.recueLe != null
                      ? 'Reçu le ${Dates.short(entry.recueLe!)}'
                      : entry.datePrevue != null
                      ? Dates.short(entry.datePrevue!)
                      : entry.moment,
                  status: switch (entry.statut) {
                    VaccineStatus.fait => 'Effectué',
                    VaccineStatus.enRetard => 'En retard',
                    VaccineStatus.aVenir => 'À venir',
                  },
                  done: entry.isDone,
                  description: entry.isDone
                      ? 'Dose enregistrée'
                      : entry.description ?? 'Touchez pour enregistrer la dose',
                  icon: entry.isDone
                      ? Icons.verified_rounded
                      : Icons.vaccines_rounded,
                  onTap: entry.isDone || vaccination.isSaving
                      ? null
                      : () => _recordDose(context, entry),
                ),
                const SizedBox(height: 12),
              ],
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF5ED),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.lightbulb_outline_rounded, color: _green),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Touchez un vaccin reçu pour l’enregistrer. Apportez votre '
                      'carnet de santé à chaque consultation.',
                      style: TextStyle(
                        color: _darkGreen,
                        height: 1.4,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Calendrier indicatif. Suivez les recommandations de votre professionnel de santé.',
              textAlign: TextAlign.center,
              style: TextStyle(color: _muted, fontSize: 11, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadErrorCard extends StatelessWidget {
  const _LoadErrorCard({required this.message, required this.onRetry});

  final String? message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(
      children: [
        Text(
          message ?? 'Impossible de charger le calendrier.',
          textAlign: TextAlign.center,
        ),
        TextButton(onPressed: onRetry, child: const Text('Réessayer')),
      ],
    ),
  );
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 13),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Row(
      children: [
        Icon(icon, color: color, size: 25),
        const SizedBox(width: 9),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: _VaccinPageColors.dark,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: _VaccinPageColors.muted,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _VaccinPageColors {
  static const dark = Color(0xFF174B32);
  static const muted = Color(0xFF7C8981);
}

class _VaccinCard extends StatelessWidget {
  const _VaccinCard({
    required this.name,
    required this.dose,
    required this.date,
    required this.status,
    required this.done,
    required this.description,
    required this.icon,
    this.onTap,
  });
  final String name;
  final String dose;
  final String date;
  final String status;
  final bool done;
  final String description;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF278451);
    const dark = Color(0xFF174B32);
    final accent = done ? green : const Color(0xFFCE922F);
    final pale = done ? const Color(0xFFE8F6ED) : const Color(0xFFFFF4DF);
    final card = Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: done ? const Color(0xFFD9EDDF) : const Color(0xFFF2E7CC),
        ),
        boxShadow: [
          BoxShadow(
            color: dark.withValues(alpha: 0.045),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 49,
            height: 49,
            decoration: BoxDecoration(
              color: pale,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: accent, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: dark,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$dose  ·  $date',
                  style: const TextStyle(
                    color: _VaccinPageColors.muted,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    color: _VaccinPageColors.muted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 7),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
            decoration: BoxDecoration(
              color: pale,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status,
              style: TextStyle(
                color: accent,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
    if (onTap == null) return card;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: card,
    );
  }
}
