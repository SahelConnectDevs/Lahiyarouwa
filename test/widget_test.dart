import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/features/auth/data/auth_repository.dart';
import 'package:lahiyarouwa/features/auth/providers/auth_provider.dart';
import 'package:lahiyarouwa/features/auth/screens/login_screen.dart';

void main() {
  testWidgets('LoginScreen affiche le formulaire de connexion', (tester) async {
    final authProvider = AuthProvider(AuthRepository(ApiClient()));

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthProvider>.value(
        value: authProvider,
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Connexion'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('Se connecter'), findsOneWidget);
  });
}
