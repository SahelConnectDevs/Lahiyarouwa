import 'package:flutter/material.dart';

class DrawerWidget extends StatelessWidget {
  const DrawerWidget({super.key});

  static const Color primary = Color(0xFFD81B60);
  static const Color danger = Color(0xFFE53935);
  static const Color textDark = Color(0xFF292929);
  static const Color textMuted = Color(0xFF777777);
  static const Color background = Color(0xFFFFFBFC);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.82,
      backgroundColor: background,
      child: SafeArea(
        child: Column(
          children: [
            // =========================================================
            // HEADER
            // =========================================================
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 22),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFD81B60), Color(0xFFF34D68)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    height: 58,
                    width: 58,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withOpacity(0.55),
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.favorite_rounded,
                      color: Colors.white,
                      size: 30,
                    ),
                  ),

                  const SizedBox(width: 14),

                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Lahiya Ouwa',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Santé maternelle et infantile',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // =========================================================
            // CONTENT
            // =========================================================
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(14, 18, 14, 10),
                children: [
                  _sectionTitle('SÉCURITÉ'),

                  _menuItem(
                    icon: Icons.warning_amber_rounded,
                    title: 'Signes de danger',
                    subtitle: 'Situations nécessitant une attention',
                    color: danger,
                    onTap: () {
                      Navigator.pop(context);

                      // TODO:
                      // Navigator.push(
                      //   context,
                      //   MaterialPageRoute(
                      //     builder: (_) => const SignesDangerPage(),
                      //   ),
                      // );
                    },
                  ),

                  _menuItem(
                    icon: Icons.emergency_rounded,
                    title: 'Urgence / Besoin d’aide',
                    subtitle: 'Contacts et assistance rapide',
                    color: danger,
                    onTap: () {
                      Navigator.pop(context);

                      // TODO: ouvrir la page urgence
                    },
                  ),

                  const SizedBox(height: 18),

                  _sectionTitle('PARAMÈTRES'),

                  _menuItem(
                    icon: Icons.settings_rounded,
                    title: 'Paramètres',
                    subtitle: 'Gérer les préférences de l’application',
                    color: primary,
                    onTap: () {
                      Navigator.pop(context);

                      // TODO:
                      // Navigator.push(
                      //   context,
                      //   MaterialPageRoute(
                      //     builder: (_) => const SettingsPage(),
                      //   ),
                      // );
                    },
                  ),

                  _menuItem(
                    icon: Icons.language_rounded,
                    title: 'Langue',
                    subtitle: 'Français, Hausa, Zarma',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(context);

                      _showLanguageDialog(context);
                    },
                  ),

                  _menuItem(
                    icon: Icons.palette_rounded,
                    title: 'Apparence',
                    subtitle: 'Clair, sombre ou système',
                    color: Colors.deepPurple,
                    onTap: () {
                      Navigator.pop(context);

                      _showThemeDialog(context);
                    },
                  ),

                  const SizedBox(height: 18),

                  // ===================================================
                  // INFO
                  // ===================================================
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.grey.withOpacity(0.10)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          height: 42,
                          width: 42,
                          decoration: BoxDecoration(
                            color: primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(13),
                          ),
                          child: const Icon(
                            Icons.favorite_rounded,
                            color: primary,
                          ),
                        ),

                        const SizedBox(width: 12),

                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Prenez soin de vous',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: textDark,
                                  fontSize: 13,
                                ),
                              ),
                              SizedBox(height: 3),
                              Text(
                                'Lahiya Ouwa vous accompagne pendant votre grossesse.',
                                style: TextStyle(
                                  color: textMuted,
                                  fontSize: 10.5,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // =========================================================
            // FOOTER
            // =========================================================
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 18),
              child: Column(
                children: [
                  Divider(color: Colors.grey.withOpacity(0.15)),
                  const SizedBox(height: 8),
                  const Text(
                    'Lahiya Ouwa',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: textDark,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Powered by SAHELCONNECT',
                    style: TextStyle(fontSize: 9.5, color: textMuted),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Version 1.0.0',
                    style: TextStyle(fontSize: 9, color: textMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===============================================================
  // TITRE SECTION
  // ===============================================================

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 0, 10, 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
          color: textMuted,
        ),
      ),
    );
  }

  // ===============================================================
  // ITEM
  // ===============================================================

  Widget _menuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(17),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(17),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 10),
            child: Row(
              children: [
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.09),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),

                const SizedBox(width: 13),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: textMuted,
                        ),
                      ),
                    ],
                  ),
                ),

                const Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: Colors.grey,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ===============================================================
  // LANGUE
  // ===============================================================

  static void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(
            'Choisir la langue',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _languageItem(context, 'Français'),
              _languageItem(context, 'Hausa'),
              _languageItem(context, 'Zarma'),
            ],
          ),
        );
      },
    );
  }

  static Widget _languageItem(BuildContext context, String language) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.language_rounded, color: primary),
      title: Text(language),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: () {
        Navigator.pop(context);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Langue sélectionnée : $language'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
    );
  }

  // ===============================================================
  // APPARENCE
  // ===============================================================

  static void _showThemeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(
            'Apparence',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _themeItem(context, Icons.light_mode_rounded, 'Clair'),
              _themeItem(context, Icons.dark_mode_rounded, 'Sombre'),
              _themeItem(context, Icons.settings_suggest_rounded, 'Système'),
            ],
          ),
        );
      },
    );
  }

  static Widget _themeItem(BuildContext context, IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: primary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: () {
        Navigator.pop(context);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Apparence : $title'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
    );
  }
}
