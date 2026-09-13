import 'package:flutter/material.dart';
import 'package:lahiyarouwa/widgets/date_picker_widget.dart';
import 'package:lahiyarouwa/view/home_page.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});
  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _dateController = TextEditingController();
  final sized = SizedBox(height: 12);
  final _formkey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: 350),
              child: Form(
                key: _formkey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(18),
                      margin: EdgeInsets.only(
                        top: 90,
                        left: 10.0,
                        right: 10.0,
                        bottom: 30,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),

                        boxShadow: [
                          BoxShadow(
                            blurRadius: 15,
                            offset: Offset(0, 5),
                            color: Colors.black.withValues(alpha: 0.08),
                          ),
                        ],
                      ),

                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Inscription',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFFD81B60),
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                            ),
                          ),
                          SizedBox(height: 2),
                          const Text(
                            'Creer votre compte',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: Colors.grey),
                          ),
                          SizedBox(height: 25),
                          TextFormField(
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre nom';
                              }
                              return null;
                            },
                            keyboardType: TextInputType.name,
                            decoration: InputDecoration(
                              labelText: 'Nom au complet',
                              prefixIcon: Icon(Icons.person),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                          sized,
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

                          TextFormField(
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre numéro';
                              }
                              return null;
                            },
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Numero de Telephone',
                              prefixIcon: Icon(Icons.numbers),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                          sized,
                          TextFormField(
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Veuillez entrer votre mot de passe';
                              }
                              return null;
                            },

                            keyboardType: TextInputType.visiblePassword,
                            decoration: InputDecoration(
                              labelText: 'Mot de passe',
                              prefixIcon: Icon(Icons.lock_outline_rounded),
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
                        ],
                      ),
                    ),
                    SizedBox(
                      width: double.infinity,
                      height: 52,

                      child: ElevatedButton(
                        onPressed: () {
                          if (_formkey.currentState!.validate()) {}
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => HomePage()),
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
