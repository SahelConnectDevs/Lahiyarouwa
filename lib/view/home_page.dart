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
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Container(
        height: 68,
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE1E1E1), width: 0.8)),
        ),

        child: BottomNavigationBar(
          // Onglet sélectionné
          currentIndex: _currentIndex,

          // Quand on clique sur un onglet
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },

          type: BottomNavigationBarType.fixed,

          backgroundColor: Colors.white,
          elevation: 0,

          selectedItemColor: const Color(0xFFFF2B7A),
          unselectedItemColor: const Color(0xFF697382),

          selectedFontSize: 12,
          unselectedFontSize: 10,

          iconSize: 23,

          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),

          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Accueil',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month_rounded),
              label: 'Cpn',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.child_care_outlined),
              activeIcon: Icon(Icons.child_care_rounded),
              label: 'Vaccin',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.health_and_safety_outlined),
              activeIcon: Icon(Icons.health_and_safety_rounded),
              label: 'Contraction',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.more_horiz_rounded),
              activeIcon: Icon(Icons.more_horiz_rounded),
              label: 'Plus',
            ),
          ],
        ),
      ),
    );
  }
}
