import 'package:flutter/material.dart';
import 'package:lahiyarouwa/widgets/tab_bebe_widget.dart';
import 'package:lahiyarouwa/widgets/tab_conseils_widget.dart';
import 'package:lahiyarouwa/widgets/tab_maman_widget.dart';

class MatherInfoPage extends StatelessWidget {
  const MatherInfoPage({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      initialIndex: initialIndex,
      child: Scaffold(
        backgroundColor: const Color(0xFFFFF8FA),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          title: const Text(
            'Suivi de grossesse',
            style: TextStyle(
              color: Color(0xFF252333),
              fontWeight: FontWeight.bold,
            ),
          ),
          bottom: const TabBar(
            labelColor: Color(0xFFD81B60),
            unselectedLabelColor: Colors.grey,
            indicatorColor: Color(0xFFFF2D6F),
            tabs: [
              Tab(text: 'Bébé'),
              Tab(text: 'Maman'),
              Tab(text: 'Conseils'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [TabBebeWidget(), TabMamanWidget(), TabConseilsWidget()],
        ),
      ),
    );
  }
}
