import 'package:flutter/material.dart';
import 'package:lahiyarouwa/view/sign_in_page.dart';

class WelcomePage extends StatefulWidget {
  const WelcomePage({super.key});

  @override
  State<WelcomePage> createState() => _WelcomePageState();
}

class _WelcomePageState extends State<WelcomePage> {
  final PageController _pageController = PageController();
  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void nextPage() {
    _pageController.nextPage(
      duration: Duration(milliseconds: 300),
      curve: Curves.ease,
    );
  }

  void previousPage() {
    _pageController.previousPage(
      duration: Duration(milliseconds: 300),
      curve: Curves.ease,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: NeverScrollableScrollPhysics(),
        children: [
          Stack(
            children: [
              Container(
                decoration: const BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.topCenter,
                    radius: 1.2,
                    colors: [
                      Color(0xFFF2BDD0),
                      Color(0xFFFEEAEA),
                      Colors.white,
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(30.0),
                    child: Column(
                      children: [
                        SizedBox(height: 18),
                        Image.asset(
                          'assets/logo_fem.png',
                          width: 120,
                          height: 90,
                        ),
                        Text(
                          'Lahiya Ouwa',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Nunito',
                            color: Color(0xFFD81B60),
                          ),
                        ),
                        Text(
                          'Sante maternelle et infantile',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            fontFamily: 'Nunito',
                            color: Colors.black,
                          ),
                        ),
                        SizedBox(height: 5),
                        Expanded(
                          child: Image.asset(
                            'assets/img2.png',
                            width: double.infinity,
                            fit: BoxFit.contain,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Nous sommes avec vous a chaque étape.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Nunito',
                            color: Colors.black,
                          ),
                        ),
                        SizedBox(height: 10),
                        Text(
                          'Suivi de grossesse, conseil santé,\nnutrition, vaccins et bien plus encore.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Nunito',
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 30),
                        SizedBox(
                          height: 52,
                          width: double.infinity,

                          child: ElevatedButton(
                            onPressed: () {
                              nextPage();
                            },
                            style: ElevatedButton.styleFrom(
                              alignment: Alignment.center,
                              backgroundColor: Color(0xFFD81B60),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              overlayColor: Colors.white.withValues(
                                alpha: 0.15,
                              ),
                              animationDuration: Duration(milliseconds: 150),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Align(
                                  alignment: Alignment.center,
                                  child: Text('Commencer'),
                                ),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Icon(
                                    Icons.arrow_forward,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(30.0),
                child: Column(
                  children: [
                    SizedBox(height: 18),
                    Text(
                      'Bienvenue !',

                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Nunito',
                        color: Color(0xFFD81B60),
                      ),
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Nous sommes la pour vous accompagner tout au long de votre grossesse.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Nunito',
                        color: Colors.black,
                      ),
                    ),
                    SizedBox(height: 5),
                    Expanded(
                      child: Image.asset(
                        'assets/img_fem2.png',
                        width: double.infinity,
                        fit: BoxFit.contain,
                      ),
                    ),

                    SizedBox(height: 30),
                    SizedBox(
                      height: 52,
                      width: double.infinity,

                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SignInPage(),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          alignment: Alignment.center,
                          backgroundColor: Color(0xFFD81B60),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Align(
                              alignment: Alignment.center,
                              child: Text(
                                'Suivant',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: Icon(
                                Icons.arrow_forward,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
