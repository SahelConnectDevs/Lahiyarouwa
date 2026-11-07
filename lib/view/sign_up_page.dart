import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/auth/providers/auth_provider.dart';
import '../widgets/date_picker_widget.dart';
import '../widgets/error_banner_widget.dart';
import '../widgets/phone_field_widget.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  final sized = const SizedBox(height: 12);
  final _formkey = GlobalKey<FormState>();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  /// Numéro complet au format international (ex: +22790123456).
  String _phoneNumber = '';
  DateTime? _birthDate;

  @override
  void dispose() {
    _nameController.dispose();
    _dateController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formkey.currentState!.validate()) return;
    // En cas de succès, la session est ouverte : _AppRoot (main.dart) vide
    // la pile et affiche l'espace connecté.
    await context.read<AuthProvider>().register(
      name: _nameController.text.trim(),
      phone: _phoneNumber,
      password: _passwordController.text,
      birthDate: _birthDate,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 350),
              child: Form(
                key: _formkey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      margin: const EdgeInsets.only(
                        top: 90,
                        left: 10,
                        right: 10,
                        bottom: 30,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                            color: Colors.black.withValues(alpha: 0.08),
                          ),
                        ],
                      ),

                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Inscription',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFFD81B60),
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                            ),
                          ),

                          const SizedBox(height: 2),

                          const Text(
                            'Creer votre compte',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: Colors.grey),
                          ),

                          const SizedBox(height: 25),

                          if (auth.errorMessage != null &&
                              auth.fieldErrors.isEmpty) ...[
                            ErrorBannerWidget(message: auth.errorMessage!),
                            const SizedBox(height: 14),
                          ],

                          // NOM COMPLET
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Veuillez entrer votre nom';
                              }
                              return null;
                            },
                            keyboardType: TextInputType.name,
                            decoration: InputDecoration(
                              labelText: 'Nom au complet',
                              errorText: auth.fieldErrors['name'],
                              prefixIcon: const Icon(Icons.person),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),

                          sized,

                          // DATE DE NAISSANCE
                          TextFormField(
                            controller: _dateController,
                            readOnly: true,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez sélectionner votre date de naissance';
                              }
                              return null;
                            },
                            decoration: InputDecoration(
                              labelText: 'Date de naissance',
                              errorText: auth.fieldErrors['birthDate'],
                              prefixIcon: const Icon(
                                Icons.calendar_today,
                                color: Color(0xFFD81B60),
                                size: 19,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                backgroundColor: Colors.transparent,
                                builder: (context) {
                                  return DatePickerWidget(
                                    initialDate: DateTime(2000, 1, 1),
                                    onDateSelected: (date) {
                                      setState(() {
                                        _birthDate = date;
                                        _dateController.text =
                                            '${date.day.toString().padLeft(2, '0')}/'
                                            '${date.month.toString().padLeft(2, '0')}/'
                                            '${date.year}';
                                      });
                                    },
                                  );
                                },
                              );
                            },
                          ),

                          sized,

                          // NUMÉRO DE TÉLÉPHONE
                          PhoneFieldWidget(
                            onChanged: (number) => _phoneNumber = number,
                          ),

                          // Ex : « Ce numéro est déjà utilisé. »
                          if (auth.fieldErrors['phone'] != null)
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                auth.fieldErrors['phone']!,
                                style: const TextStyle(
                                  color: Color(0xFFC62828),
                                  fontSize: 12,
                                ),
                              ),
                            ),

                          sized,

                          // MOT DE PASSE
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            keyboardType: TextInputType.visiblePassword,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre mot de passe';
                              }

                              if (value.length < 8) {
                                return '8 caractères minimum';
                              }

                              return null;
                            },
                            decoration: InputDecoration(
                              labelText: 'Mot de passe',
                              errorText: auth.fieldErrors['password'],
                              prefixIcon: const Icon(
                                Icons.lock_outline_rounded,
                              ),
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
                          ),

                          sized,

                          // CONFIRMATION DU MOT DE PASSE
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: _obscureConfirmPassword,
                            keyboardType: TextInputType.visiblePassword,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez confirmer votre mot de passe';
                              }

                              if (value != _passwordController.text) {
                                return 'Les mots de passe ne correspondent pas';
                              }

                              return null;
                            },
                            decoration: InputDecoration(
                              labelText: 'Confirmer le mot de passe',
                              prefixIcon: const Icon(
                                Icons.lock_outline_rounded,
                              ),
                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _obscureConfirmPassword =
                                        !_obscureConfirmPassword;
                                  });
                                },
                                icon: Icon(
                                  _obscureConfirmPassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                ),
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),

                          sized,
                        ],
                      ),
                    ),

                    // BOUTON INSCRIPTION
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: auth.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD81B60),
                          disabledBackgroundColor: const Color(0xFFE891B2),
                          foregroundColor: Colors.white,
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
                                    "S'inscrire",
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
