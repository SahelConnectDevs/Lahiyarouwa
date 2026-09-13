import 'package:flutter/material.dart';

class MatherInfoPage extends StatelessWidget {
  const MatherInfoPage({super.key, this.initialIndex = 0});
  final int initialIndex;
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      initialIndex: initialIndex,
      child: Scaffold(
        appBar: AppBar(
          bottom: TabBar(
            tabs: [
              Tab(text: 'Bebe'),
              Center(child: Tab(text: 'Maman')),
              Center(child: Tab(text: 'Conseil')),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          flex: 63,
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(
                                minWidth: 300,
                                maxWidth: 350,
                                minHeight: 300,
                                maxHeight: 350,
                              ),
                              child: Image.asset(
                                'assets/img_bebe.png',
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(width: 20),

                        Expanded(
                          flex: 37,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Text('Poids'),

                              const Text(
                                '12 g',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 25,
                                ),
                              ),

                              const SizedBox(height: 25),

                              const Text('Taille'),

                              const Text(
                                '20.1 cm',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 25,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Cette semaine, votre bébé bouge davantage et ses organes '
                          'continuent à se développer.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            height: 1.5,
                            color: Colors.black87,
                          ),
                        ),

                        const SizedBox(height: 16),

                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: const LinearGradient(
                              colors: [
                                Color.fromARGB(255, 249, 158, 192),

                                Color.fromARGB(255, 232, 155, 155),

                                Color(0xFFD81B60),
                              ],
                            ),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'À savoir',
                                style: TextStyle(
                                  color: Color.fromARGB(255, 255, 4, 4),
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              SizedBox(height: 8),

                              Text(
                                'Ses empreintes digitales commencent à se développer.',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            SingleChildScrollView(
              child: Column(
                children: [
                  Center(child: Text('Page Accueil')),
                  Center(child: Text('Page Produits')),
                  Center(child: Text('Page Profil')),

                  Center(
                    child: Text(
                      'Page Accu.....................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;.................................................::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::..............................................................................................................................................dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeewwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeil',
                    ),
                  ),
                  Center(child: Text('Page Produits')),
                  Center(child: Text('Page Profil')),
                  Center(child: Text('Page Accueil')),
                  Center(child: Text('Page Produits')),
                  Center(child: Text('Page Profil')),
                  Text('Page Conseil'),
                ],
              ),
            ),
            Center(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    Center(child: Text('Page Accueil')),
                    Center(child: Text('Page Produits')),
                    Center(child: Text('Page Profil')),

                    Center(child: Text('Page Accueil')),
                    Center(child: Text('Page Produits')),
                    Center(child: Text('Page Profil')),
                    Center(child: Text('Page Accueil')),
                    Center(child: Text('Page Produits')),
                    Center(child: Text('Page Profil')),
                    Text('Page Conseil'),
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
