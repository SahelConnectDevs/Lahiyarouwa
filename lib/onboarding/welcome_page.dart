import 'package:flutter/material.dart';
import 'package:lahiyarouwa/view/sign_in_page.dart';
import 'package:lahiyarouwa/widgets/elevated_button_widget.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

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
      duration: const Duration(milliseconds: 300),
      curve: Curves.ease,
    );
  }

  void previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.ease,
    );
  }

  // push (et non pushReplacement) : l'accueil reste l'écran racine de
  // _AppRoot, qui vide la pile une fois la connexion réussie.
  void skip() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SignInPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const BouncingScrollPhysics(),
        children: [
          // ==========================================================
          // PAGE 1
          // ==========================================================
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
                        Align(
                          alignment: Alignment.centerRight,
                          child: Padding(
                            padding: const EdgeInsets.only(top: 10, right: 5),
                            child: TextButton(
                              onPressed: skip,
                              child: const Text(
                                'Passer',
                                style: TextStyle(
                                  color: Color(0xFFD81B60),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 18),

                        Image.asset(
                          'assets/logo_fem.png',
                          width: 120,
                          height: 90,
                        ),

                        const Text(
                          'Lahiya Ouwa',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Nunito',
                            color: Color(0xFFD81B60),
                          ),
                        ),

                        const Text(
                          'Sante maternelle et infantile',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            fontFamily: 'Nunito',
                            color: Colors.black,
                          ),
                        ),

                        const SizedBox(height: 5),

                        Expanded(
                          child: Image.asset(
                            'assets/img2.png',
                            width: double.infinity,
                            fit: BoxFit.contain,
                          ),
                        ),

                        const SizedBox(height: 5),

                        const Text(
                          'Nous sommes avec vous a chaque étape.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Nunito',
                            color: Colors.black,
                          ),
                        ),

                        const SizedBox(height: 10),

                        const Text(
                          'Suivi de grossesse, conseil santé,\n'
                          'nutrition, vaccins et bien plus encore.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Nunito',
                            color: Colors.grey,
                          ),
                        ),

                        const SizedBox(height: 30),

                        // ==================================================
                        // SMOOTH PAGE INDICATOR MODERNE
                        // ==================================================
                        SmoothPageIndicator(
                          controller: _pageController,
                          count: 2,
                          effect: ExpandingDotsEffect(
                            dotHeight: 8,
                            dotWidth: 8,
                            spacing: 6,
                            expansionFactor: 3,
                            activeDotColor: const Color(0xFFD81B60),
                            dotColor: Colors.grey.shade300,
                          ),
                        ),

                        const SizedBox(height: 30),

                        ElevatedButtonWidget(
                          height: 52,
                          width: double.infinity,
                          backgroundColor:
                              WidgetStateProperty.resolveWith<Color>((states) {
                                if (states.contains(WidgetState.hovered)) {
                                  return Colors.white;
                                } else if (states.contains(
                                  WidgetState.pressed,
                                )) {
                                  return Colors.white;
                                }

                                return Colors.pink;
                              }),
                          foregroundColor:
                              WidgetStateProperty.resolveWith<Color>((states) {
                                if (states.contains(WidgetState.hovered)) {
                                  return Colors.pink;
                                } else if (states.contains(
                                  WidgetState.pressed,
                                )) {
                                  return Colors.pink;
                                }

                                return Colors.white;
                              }),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          side: WidgetStateProperty.resolveWith<BorderSide?>((
                            states,
                          ) {
                            if (states.contains(WidgetState.hovered)) {
                              return const BorderSide(
                                color: Colors.pink,
                                width: 1,
                              );
                            } else if (states.contains(WidgetState.pressed)) {
                              return const BorderSide(
                                color: Colors.pink,
                                width: 1,
                              );
                            }

                            return const BorderSide(
                              color: Colors.white,
                              width: 1,
                            );
                          }),
                          text: 'Commencer',
                          icon: const Icon(Icons.waving_hand),
                          onPressed: nextPage,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          // ==========================================================
          // PAGE 2
          // ==========================================================
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(30.0),
                child: Column(
                  children: [
                    Align(
                      alignment: Alignment.centerRight,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 10, right: 5),
                        child: TextButton(
                          onPressed: skip,
                          child: const Text(
                            'Passer',
                            style: TextStyle(
                              color: Color(0xFFD81B60),
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    const Text(
                      'Bienvenue !',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Nunito',
                        color: Color(0xFFD81B60),
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      'Nous sommes la pour vous accompagner '
                      'tout au long de votre grossesse.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Nunito',
                        color: Colors.black,
                      ),
                    ),

                    const SizedBox(height: 5),

                    Expanded(
                      child: Image.asset(
                        'assets/img_fem2.png',
                        width: double.infinity,
                        fit: BoxFit.contain,
                      ),
                    ),

                    const SizedBox(height: 30),

                    // ==================================================
                    // SMOOTH PAGE INDICATOR MODERNE
                    // ==================================================
                    SmoothPageIndicator(
                      controller: _pageController,
                      count: 2,
                      effect: ExpandingDotsEffect(
                        dotHeight: 8,
                        dotWidth: 8,
                        spacing: 6,
                        expansionFactor: 3,
                        activeDotColor: const Color(0xFFD81B60),
                        dotColor: Colors.grey.shade300,
                      ),
                    ),

                    const SizedBox(height: 30),

                    ElevatedButtonWidget(
                      height: 52,
                      width: double.infinity,
                      backgroundColor: WidgetStateProperty.resolveWith<Color>((
                        states,
                      ) {
                        if (states.contains(WidgetState.hovered)) {
                          return Colors.white;
                        } else if (states.contains(WidgetState.pressed)) {
                          return Colors.white;
                        }

                        return Colors.pink;
                      }),
                      foregroundColor: WidgetStateProperty.resolveWith<Color>((
                        states,
                      ) {
                        if (states.contains(WidgetState.hovered)) {
                          return Colors.pink;
                        } else if (states.contains(WidgetState.pressed)) {
                          return Colors.pink;
                        }

                        return Colors.white;
                      }),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      side: WidgetStateProperty.resolveWith<BorderSide?>((
                        states,
                      ) {
                        if (states.contains(WidgetState.hovered)) {
                          return const BorderSide(color: Colors.pink, width: 1);
                        } else if (states.contains(WidgetState.pressed)) {
                          return const BorderSide(color: Colors.pink, width: 1);
                        }

                        return const BorderSide(color: Colors.white, width: 1);
                      }),
                      text: 'Suivant',
                      icon: const Icon(Icons.arrow_forward),
                      onPressed: skip,
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
