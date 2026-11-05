import 'package:floating_bottom_navigation_bar/floating_bottom_navigation_bar.dart';
import 'package:flutter/material.dart';
import 'package:lahiyarouwa/view/accueil_page.dart';
import 'package:lahiyarouwa/view/contraction_page.dart';
import 'package:lahiyarouwa/view/plus_page.dart';
import 'package:lahiyarouwa/view/vaccin_page.dart';
import './cpn_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;
  final List<Widget> _pages = [
    const AccueilPage(),
    const CpnPage(),
    const VaccinPage(),
    const ContractionPage(),
    const PlusPage(),
  ];
  static const _selectedColor = Color(0xFFFF2B7A);
  static const _unselectedColor = Color(0xFF697382);

  // Dimensions de la barre : la hauteur du BottomAppBar interne au package
  // est calculée à partir d'elles pour que le contenu tienne sans overflow.
  static const double _itemHeight = 48;
  static const double _barPaddingV = 6;
  static const double _bottomMargin = 12;

  static const _items = [
    (icon: Icons.home_rounded, title: 'Accueil'),
    (icon: Icons.calendar_month_rounded, title: 'Cpn'),
    (icon: Icons.child_care_rounded, title: 'Vaccin'),
    (icon: Icons.health_and_safety_rounded, title: 'Contraction'),
    (icon: Icons.more_horiz_rounded, title: 'Plus'),
  ];

  @override
  Widget build(BuildContext context) {
    final navItems = [
      for (final item in _items)
        FloatingNavbarItem(icon: item.icon, title: item.title),
    ];

    return Scaffold(
      body: _pages[_currentIndex],
      // Laisse le contenu passer sous la barre pour l'effet "flottant".
      extendBody: true,
      // FloatingNavbar s'appuie sur un BottomAppBar dont la hauteur par
      // défaut (Material 3 : 80 px avec 12 px de padding vertical) est trop
      // petite pour son contenu : on la fixe ici à la taille exacte.
      bottomNavigationBar: Theme(
        data: Theme.of(context).copyWith(
          bottomAppBarTheme: const BottomAppBarThemeData(
            height: _itemHeight + 2 * _barPaddingV + _bottomMargin,
            padding: EdgeInsets.zero,
          ),
        ),
        child: FloatingNavbar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: Colors.white,
          borderRadius: 24,
          elevation: 0,
          margin: const EdgeInsets.fromLTRB(12, 0, 12, _bottomMargin),
          padding: const EdgeInsets.symmetric(vertical: _barPaddingV),
          items: navItems,
          itemBuilder: (context, item) => _buildNavItem(navItems, item),
        ),
      ),
    );
  }

  /// Onglet de hauteur fixe : le FittedBox réduit l'icône et le libellé si
  /// la place manque (petit écran, texte agrandi dans les réglages du
  /// téléphone) au lieu de provoquer un overflow.
  Widget _buildNavItem(
    List<FloatingNavbarItem> navItems,
    FloatingNavbarItem item,
  ) {
    final index = navItems.indexOf(item);
    final selected = index == _currentIndex;
    final color = selected ? _selectedColor : _unselectedColor;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Material(
          color: selected ? const Color(0xFFFFE4EE) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => setState(() => _currentIndex = index),
            child: SizedBox(
              height: _itemHeight,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(item.icon, color: color, size: 23),
                      const SizedBox(height: 2),
                      Text(
                        item.title!,
                        maxLines: 1,
                        style: TextStyle(
                          color: color,
                          fontSize: 10,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
