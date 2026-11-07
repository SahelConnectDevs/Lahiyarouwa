import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/auth/providers/auth_provider.dart';

class PlusPage extends StatefulWidget {
  const PlusPage({super.key});

  @override
  State<PlusPage> createState() => _PlusPageState();
}

class _PlusPageState extends State<PlusPage> {
  Future<void> _confirmLogout() async {
    final auth = context.read<AuthProvider>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Se déconnecter ?'),
        content: const Text(
          'Vos données restent enregistrées : vous les retrouverez en vous '
          'reconnectant avec votre numéro et votre mot de passe.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Se déconnecter',
              style: TextStyle(color: Color(0xFFC62828)),
            ),
          ),
        ],
      ),
    );
    // _AppRoot (main.dart) revient à l'accueil dès que la session est fermée.
    if (confirmed == true) await auth.logout();
  }

  static const Color primary = Color(0xFFD81B60);
  static const Color pink = Color(0xFFF34D68);
  static const Color background = Color(0xFFFFFBFC);
  static const Color textDark = Color(0xFF25242A);
  static const Color textMuted = Color(0xFF777780);

  bool notificationsEnabled = true;
  String selectedLanguage = 'Français';
  String selectedTheme = 'Clair';

  // ============================================================
  // DIALOG LANGUE
  // ============================================================

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Text(
            'Choisir la langue',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _LanguageOption(
                title: 'Français',
                selected: selectedLanguage == 'Français',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'Français';
                  });
                  Navigator.pop(context);
                },
              ),
              _LanguageOption(
                title: 'Hausa',
                selected: selectedLanguage == 'Hausa',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'Hausa';
                  });
                  Navigator.pop(context);
                },
              ),
              _LanguageOption(
                title: 'Zarma',
                selected: selectedLanguage == 'Zarma',
                onTap: () {
                  setState(() {
                    selectedLanguage = 'Zarma';
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ============================================================
  // DIALOG APPARENCE
  // ============================================================

  void _showThemeDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          title: const Text(
            'Apparence',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _LanguageOption(
                title: 'Clair',
                icon: Icons.light_mode_rounded,
                selected: selectedTheme == 'Clair',
                onTap: () {
                  setState(() {
                    selectedTheme = 'Clair';
                  });
                  Navigator.pop(context);
                },
              ),
              _LanguageOption(
                title: 'Sombre',
                icon: Icons.dark_mode_rounded,
                selected: selectedTheme == 'Sombre',
                onTap: () {
                  setState(() {
                    selectedTheme = 'Sombre';
                  });
                  Navigator.pop(context);
                },
              ),
              _LanguageOption(
                title: 'Système',
                icon: Icons.settings_suggest_rounded,
                selected: selectedTheme == 'Système',
                onTap: () {
                  setState(() {
                    selectedTheme = 'Système';
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ============================================================
  // DIALOG AIDE
  // ============================================================

  void _showHelpDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          icon: const Icon(
            Icons.support_agent_rounded,
            color: primary,
            size: 32,
          ),
          title: const Text('Besoin d’aide ?', textAlign: TextAlign.center),
          content: const Text(
            'Pour toute question concernant l’utilisation '
            'de l’application, contactez votre centre de santé '
            'ou le support de l’application.',
            textAlign: TextAlign.center,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Fermer',
                style: TextStyle(color: primary, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  // ============================================================
  // PROFIL
  // ============================================================

  void _openProfile() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Page profil bientôt disponible'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: background,

      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ====================================================
            // HEADER
            // ====================================================

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF6B8A), Color(0xFFD81B60)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(17),
                        boxShadow: [
                          BoxShadow(
                            color: primary.withValues(alpha: 0.18),
                            blurRadius: 12,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        color: Colors.white,
                        size: 27,
                      ),
                    ),

                    const SizedBox(width: 13),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bonjour ${context.watch<AuthProvider>().firstName} 👋',
                            style: TextStyle(color: textMuted, fontSize: 12),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Mon espace',
                            style: TextStyle(
                              color: textDark,
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),

                    _HeaderButton(
                      icon: Icons.notifications_none_rounded,
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Aucune nouvelle notification'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            // ====================================================
            // PROFIL
            // ====================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 8, 18, 8),
                child: _ProfileCard(onTap: _openProfile),
              ),
            ),

            // ====================================================
            // MON COMPTE
            // ====================================================
            SliverToBoxAdapter(
              child: _SectionTitle(
                title: 'Mon compte',
                icon: Icons.person_outline_rounded,
              ),
            ),

            SliverToBoxAdapter(
              child: _MenuCard(
                children: [
                  _MenuItem(
                    icon: Icons.person_outline_rounded,
                    iconBackground: const Color(0xFFFFE7EF),
                    iconColor: primary,
                    title: 'Mes informations',
                    subtitle: 'Gérer mes informations personnelles',
                    onTap: _openProfile,
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.notifications_none_rounded,
                    iconBackground: const Color(0xFFFFF0E3),
                    iconColor: const Color(0xFFE58A2B),
                    title: 'Notifications',
                    subtitle: notificationsEnabled
                        ? 'Rappels et alertes activés'
                        : 'Notifications désactivées',
                    trailing: Switch(
                      value: notificationsEnabled,
                      onChanged: (value) {
                        setState(() {
                          notificationsEnabled = value;
                        });
                      },
                      activeThumbColor: primary,
                    ),
                    onTap: () {
                      setState(() {
                        notificationsEnabled = !notificationsEnabled;
                      });
                    },
                  ),
                ],
              ),
            ),

            // ====================================================
            // SANTÉ
            // ====================================================
            SliverToBoxAdapter(
              child: _SectionTitle(
                title: 'Santé & assistance',
                icon: Icons.health_and_safety_outlined,
              ),
            ),

            SliverToBoxAdapter(
              child: _MenuCard(
                children: [
                  _MenuItem(
                    icon: Icons.local_hospital_outlined,
                    iconBackground: const Color(0xFFE8F4FF),
                    iconColor: const Color(0xFF3B82C4),
                    title: 'Centres de santé',
                    subtitle: 'Trouver un centre proche',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Recherche des centres de santé'),
                        ),
                      );
                    },
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.phone_outlined,
                    iconBackground: const Color(0xFFE9F8EF),
                    iconColor: const Color(0xFF27A55A),
                    title: 'Numéros utiles',
                    subtitle: 'Contacts importants',
                    onTap: () {},
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.warning_amber_rounded,
                    iconBackground: const Color(0xFFFFE8E8),
                    iconColor: pink,
                    title: 'Signes de danger',
                    subtitle: 'Quand consulter rapidement',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            // ====================================================
            // PARAMÈTRES
            // ====================================================
            SliverToBoxAdapter(
              child: _SectionTitle(
                title: 'Paramètres',
                icon: Icons.settings_outlined,
              ),
            ),

            SliverToBoxAdapter(
              child: _MenuCard(
                children: [
                  _MenuItem(
                    icon: Icons.language_rounded,
                    iconBackground: const Color(0xFFEDEAFF),
                    iconColor: const Color(0xFF7357C8),
                    title: 'Langue',
                    subtitle: selectedLanguage,
                    onTap: _showLanguageDialog,
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.dark_mode_outlined,
                    iconBackground: const Color(0xFFECECF4),
                    iconColor: const Color(0xFF59596A),
                    title: 'Apparence',
                    subtitle: selectedTheme,
                    onTap: _showThemeDialog,
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.lock_outline_rounded,
                    iconBackground: const Color(0xFFFFEAF1),
                    iconColor: primary,
                    title: 'Confidentialité',
                    subtitle: 'Protection de vos données',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            // ====================================================
            // À PROPOS
            // ====================================================
            SliverToBoxAdapter(
              child: _SectionTitle(
                title: 'À propos',
                icon: Icons.info_outline_rounded,
              ),
            ),

            SliverToBoxAdapter(
              child: _MenuCard(
                children: [
                  _MenuItem(
                    icon: Icons.favorite_outline_rounded,
                    iconBackground: const Color(0xFFFFE8EE),
                    iconColor: pink,
                    title: 'À propos de l’application',
                    subtitle: 'En savoir plus sur Lahiya Ouwa',
                    onTap: () {},
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.description_outlined,
                    iconBackground: const Color(0xFFF0EEF2),
                    iconColor: textMuted,
                    title: 'Conditions d’utilisation',
                    subtitle: 'Consulter les conditions',
                    onTap: () {},
                  ),

                  const _Divider(),

                  _MenuItem(
                    icon: Icons.privacy_tip_outlined,
                    iconBackground: const Color(0xFFEAF4FF),
                    iconColor: const Color(0xFF4585B7),
                    title: 'Politique de confidentialité',
                    subtitle: 'Comment vos données sont utilisées',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            // ====================================================
            // DÉCONNEXION
            // ====================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: _MenuCard(
                  children: [
                    _MenuItem(
                      icon: Icons.logout_rounded,
                      iconBackground: const Color(0xFFFFEBEE),
                      iconColor: const Color(0xFFC62828),
                      title: 'Se déconnecter',
                      subtitle:
                          context.watch<AuthProvider>().currentUser?.phone ??
                          'Fermer la session sur ce téléphone',
                      onTap: _confirmLogout,
                    ),
                  ],
                ),
              ),
            ),

            // ====================================================
            // AIDE
            // ====================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 10),
                child: _HelpCard(onTap: _showHelpDialog),
              ),
            ),

            // ====================================================
            // VERSION
            // ====================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 10, bottom: 30),
                child: Column(
                  children: const [
                    Text(
                      'Lahiya Ouwa',
                      style: TextStyle(
                        color: textMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    SizedBox(height: 4),

                    Text(
                      'Version 1.0.0',
                      style: TextStyle(color: Color(0xFFAAA5AA), fontSize: 11),
                    ),

                    SizedBox(height: 5),

                    Text(
                      'Powered by SAHELCONNECT',
                      style: TextStyle(
                        color: Color(0xFFB7B2B6),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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

// ================================================================
// HEADER BUTTON
// ================================================================

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(15),
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: onTap,
        child: Container(
          width: 45,
          height: 45,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: const Color(0xFFF1E7EA)),
          ),
          child: Icon(icon, color: _PlusPageState.textDark, size: 22),
        ),
      ),
    );
  }
}

// ================================================================
// PROFILE CARD
// ================================================================

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFD81B60), Color(0xFFF34D68)],
            ),
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: _PlusPageState.primary.withValues(alpha: 0.18),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),

              const SizedBox(width: 13),

              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mon profil',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Gérez vos informations personnelles',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ),
              ),

              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ================================================================
// SECTION TITLE
// ================================================================

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 9),
      child: Row(
        children: [
          Icon(icon, size: 18, color: _PlusPageState.primary),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              color: _PlusPageState.textDark,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

// ================================================================
// MENU CARD
// ================================================================

class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1E7EA)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.018),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

// ================================================================
// MENU ITEM
// ================================================================

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 43,
              height: 43,
              decoration: BoxDecoration(
                color: iconBackground,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: iconColor, size: 21),
            ),

            const SizedBox(width: 12),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: _PlusPageState.textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _PlusPageState.textMuted,
                      fontSize: 10.5,
                    ),
                  ),
                ],
              ),
            ),

            trailing ??
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Color(0xFFB5AFB3),
                  size: 14,
                ),
          ],
        ),
      ),
    );
  }
}

// ================================================================
// HELP CARD
// ================================================================

class _HelpCard extends StatelessWidget {
  const _HelpCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFEEF3), Color(0xFFFFF8FA)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF7DCE4)),
        ),
        child: Row(
          children: [
            Container(
              width: 43,
              height: 43,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.support_agent_rounded,
                color: _PlusPageState.primary,
              ),
            ),

            const SizedBox(width: 12),

            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Besoin d’aide ?',
                    style: TextStyle(
                      color: _PlusPageState.textDark,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Nous sommes là pour vous accompagner.',
                    style: TextStyle(
                      color: _PlusPageState.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),

            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: _PlusPageState.primary,
            ),
          ],
        ),
      ),
    );
  }
}

// ================================================================
// LANGUAGE OPTION
// ================================================================

class _LanguageOption extends StatelessWidget {
  const _LanguageOption({
    required this.title,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String title;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(
        icon ??
            (selected ? Icons.radio_button_checked : Icons.radio_button_off),
        color: selected ? _PlusPageState.primary : _PlusPageState.textMuted,
      ),
      title: Text(title),
      trailing: selected
          ? const Icon(Icons.check_rounded, color: _PlusPageState.primary)
          : null,
    );
  }
}

// ================================================================
// DIVIDER
// ================================================================

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(left: 68),
      child: Divider(height: 1, thickness: 0.7, color: Color(0xFFF2ECEE)),
    );
  }
}
