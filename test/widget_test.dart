import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:provider/provider.dart';

import 'package:lahiyarouwa/core/errors/app_exception.dart';
import 'package:lahiyarouwa/features/auth/data/auth_repository.dart';
import 'package:lahiyarouwa/features/auth/providers/auth_provider.dart';
import 'package:lahiyarouwa/features/grossesse/data/grossesse_repository.dart';
import 'package:lahiyarouwa/features/grossesse/providers/grossesse_provider.dart';
import 'package:lahiyarouwa/view/ddr_page.dart';
import 'package:lahiyarouwa/view/sign_in_page.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

class MockGrossesseRepository extends Mock implements GrossesseRepository {}

void main() {
  group('SignInPage', () {
    late MockAuthRepository repository;
    late AuthProvider auth;

    Future<void> pump(WidgetTester tester) => tester.pumpWidget(
      ChangeNotifierProvider<AuthProvider>.value(
        value: auth,
        child: const MaterialApp(home: SignInPage()),
      ),
    );

    setUp(() {
      repository = MockAuthRepository();
      auth = AuthProvider(repository);
    });

    testWidgets('affiche le formulaire de connexion par téléphone', (
      tester,
    ) async {
      await pump(tester);

      expect(find.text('Bienvenue'), findsOneWidget);
      expect(find.text('Numéro de téléphone'), findsOneWidget);
      expect(find.text('Mot de passe'), findsOneWidget);
      expect(find.text('Se connecter'), findsOneWidget);
    });

    testWidgets('ne contacte pas l\'API si le formulaire est invalide', (
      tester,
    ) async {
      await pump(tester);

      await tester.tap(find.text('Se connecter'));
      await tester.pump();

      expect(find.text('Veuillez entrer votre mot de passe'), findsOneWidget);
      verifyNever(
        () => repository.login(
          phone: any(named: 'phone'),
          password: any(named: 'password'),
        ),
      );
    });

    testWidgets('affiche l\'erreur renvoyée par l\'API', (tester) async {
      when(
        () => repository.login(
          phone: any(named: 'phone'),
          password: any(named: 'password'),
        ),
      ).thenThrow(const UnauthorizedException('Identifiants invalides.'));
      await pump(tester);

      await tester.enterText(find.byType(TextFormField).first, '90123456');
      await tester.enterText(find.byType(TextFormField).last, 'mauvais');
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();

      expect(find.text('Identifiants invalides.'), findsOneWidget);
      verify(
        () => repository.login(phone: '+22790123456', password: 'mauvais'),
      ).called(1);
    });
  });

  group('DdrPage', () {
    testWidgets('propose « Plus tard » quand elle est l\'écran racine', (
      tester,
    ) async {
      // Écran de téléphone haut : tout le formulaire est visible sans défiler.
      await tester.binding.setSurfaceSize(const Size(420, 1400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final grossesse = GrossesseProvider(MockGrossesseRepository());
      await tester.pumpWidget(
        ChangeNotifierProvider<GrossesseProvider>.value(
          value: grossesse,
          child: const MaterialApp(home: DdrPage()),
        ),
      );

      expect(find.text('Date des dernières règles'), findsOneWidget);
      expect(find.text('Enregistrer'), findsOneWidget);
      expect(find.textContaining('SA +'), findsOneWidget);

      await tester.tap(find.text('Plus tard'));
      await tester.pump();
      expect(grossesse.ddrSkipped, isTrue);
    });
  });
}
