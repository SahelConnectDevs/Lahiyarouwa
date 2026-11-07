import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/auth/providers/auth_provider.dart';
import '../widgets/error_banner_widget.dart';
import '../widgets/phone_field_widget.dart';
import 'sign_up_page.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;

  /// Numéro complet au format international (ex: +22790123456).
  String _phoneNumber = '';

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    // En cas de succès, _AppRoot (main.dart) affiche l'espace connecté et
    // retire cet écran de la pile : rien d'autre à faire ici.
    await context.read<AuthProvider>().login(
      phone: _phoneNumber,
      password: _passwordController.text,
    );
  }

  void _forgotPassword() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mot de passe oublié'),
        content: const Text(
          'La réinitialisation du mot de passe depuis l’application '
          'n’est pas encore disponible. Rapprochez-vous de votre agent '
          'communautaire ou de l’équipe Lahiyar Ouwa.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Compris'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

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

                          if (auth.errorMessage != null) ...[
                            ErrorBannerWidget(message: auth.errorMessage!),
                            const SizedBox(height: 14),
                          ],

                          // =========================
                          // NUMÉRO DE TÉLÉPHONE
                          // =========================
                          PhoneFieldWidget(
                            onChanged: (number) => _phoneNumber = number,
                          ),

                          // intl_phone_field réserve déjà l'espace de son
                          // message d'erreur sous le champ.
                          const SizedBox(height: 4),

                          // =========================
                          // MOT DE PASSE
                          // =========================
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _submit(),

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
                          // MOT DE PASSE OUBLIÉ
                          // =========================
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: _forgotPassword,
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
                    ),

                    const SizedBox(height: 22),

                    // =========================
                    // BOUTON SE CONNECTER
                    // =========================
                    SizedBox(
                      width: double.infinity,
                      height: 52,

                      child: ElevatedButton(
                        onPressed: auth.isLoading ? null : _submit,

                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD81B60),
                          disabledBackgroundColor: const Color(0xFFE891B2),

                          foregroundColor: Colors.white,
                          overlayColor: const Color.fromARGB(
                            255,
                            36,
                            8,
                            251,
                          ).withValues(alpha: 0.20),

                          elevation: 2,

                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),

                        child: auth.isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : const Row(
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
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,

                      children: [
                        const Text(
                          "Vous n'avez pas de compte ?",
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),

                        TextButton(
                          onPressed: () {
                            auth.clearError();
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
