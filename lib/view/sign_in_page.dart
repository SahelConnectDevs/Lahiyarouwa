import 'package:flutter/material.dart';
import 'package:lahiyarouwa/view/ddr_page.dart';
import '/view/sign_up_page.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _formKey = GlobalKey<FormState>();

  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFBFC),

      body: SafeArea(
        child: Center(
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),

              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),

                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // =========================
                    // CARTE DU FORMULAIRE
                    // =========================
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),

                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),

                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),

                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Titre
                          const Text(
                            'Bienvenue',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFD81B60),
                            ),
                          ),

                          const SizedBox(height: 8),

                          const Text(
                            'Connectez-vous à votre compte',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: Colors.grey),
                          ),

                          const SizedBox(height: 25),

                          // =========================
                          // NUMÉRO DE TÉLÉPHONE
                          // =========================
                          TextFormField(
                            keyboardType: TextInputType.phone,
                            textInputAction: TextInputAction.next,

                            decoration: InputDecoration(
                              labelText: 'Numéro de téléphone',

                              prefixIcon: const Icon(Icons.phone_outlined),

                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),

                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre numéro';
                              }

                              return null;
                            },
                          ),

                          const SizedBox(height: 15),

                          // =========================
                          // MOT DE PASSE
                          // =========================
                          TextFormField(
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,

                            decoration: InputDecoration(
                              labelText: 'Mot de passe',

                              prefixIcon: const Icon(Icons.lock_outline),

                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },

                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                ),
                              ),

                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),

                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre mot de passe';
                              }

                              return null;
                            },
                          ),

                          const SizedBox(height: 8),

                          // =========================
                          // SE SOUVENIR / MOT DE PASSE OUBLIÉ
                          // =========================
                          Row(
                            children: [
                              Checkbox(
                                value: _rememberMe,

                                activeColor: const Color(0xFFD81B60),

                                onChanged: (value) {
                                  setState(() {
                                    _rememberMe = value ?? false;
                                  });
                                },
                              ),

                              const Expanded(
                                child: Text(
                                  'Se souvenir de moi',
                                  style: TextStyle(fontSize: 13),
                                ),
                              ),

                              Expanded(
                                child: TextButton(
                                  onPressed: () {},

                                  child: const Text(
                                    'Mot de passe oublié ?',
                                    style: TextStyle(
                                      color: Color(0xFFD81B60),
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 22),

                    // =========================
                    // BOUTON SE CONNECTER
                    // =========================
                    SizedBox(
                      width: double.infinity,
                      height: 52,

                      child: ElevatedButton(
                        onPressed: () {
                          if (_formKey.currentState!.validate()) {
                            print('Connexion');
                          }

                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => DdrPage()),
                          );
                        },

                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD81B60),

                          foregroundColor: Colors.white,

                          elevation: 2,

                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),

                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,

                          children: [
                            Text(
                              'Se connecter',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),

                            SizedBox(width: 10),

                            Icon(Icons.arrow_forward, size: 18),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 15),

                    // =========================
                    // INSCRIPTION
                    // =========================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,

                      children: [
                        const Text(
                          "Vous n'avez pas de compte ?",
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),

                        Expanded(
                          child: TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const SignUpPage(),
                                ),
                              );
                            },
                            child: const Text(
                              'S’inscrire',
                              style: TextStyle(
                                color: Color(0xFFD81B60),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
