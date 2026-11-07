// Modèle à suivre pour les tests unitaires des autres *Provider : on mocke le
// repository (jamais ApiClient/Dio ni flutter_secure_storage) pour rester
// rapide, déterministe, et indépendant du réseau. Voir CLAUDE.md > Tests.

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/errors/app_exception.dart';
import 'package:lahiyarouwa/features/auth/data/auth_repository.dart';
import 'package:lahiyarouwa/features/auth/data/models/user_model.dart';
import 'package:lahiyarouwa/features/auth/providers/auth_provider.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository authRepository;
  late AuthProvider authProvider;

  const user = UserModel(id: '1', name: 'Awa Moussa', phone: '+22790123456');

  void stubLogin() => when(
    () => authRepository.login(
      phone: any(named: 'phone'),
      password: any(named: 'password'),
    ),
  ).thenAnswer((_) async => user);

  setUp(() {
    authRepository = MockAuthRepository();
    authProvider = AuthProvider(authRepository);
    when(() => authRepository.logout()).thenAnswer((_) async {});
  });

  group('login', () {
    test('passe en authenticated et stocke le user en cas de succès', () async {
      stubLogin();

      final result = await authProvider.login(
        phone: user.phone!,
        password: 'secret1',
      );

      expect(result, isTrue);
      expect(authProvider.status, AuthStatus.authenticated);
      expect(authProvider.currentUser, user);
      expect(authProvider.firstName, 'Awa');
      expect(authProvider.errorMessage, isNull);
      verify(
        () => authRepository.login(phone: '+22790123456', password: 'secret1'),
      ).called(1);
    });

    test(
      'reste unauthenticated et expose le message en cas d\'erreur serveur',
      () async {
        when(
          () => authRepository.login(
            phone: any(named: 'phone'),
            password: any(named: 'password'),
          ),
        ).thenThrow(const UnauthorizedException('Identifiants invalides.'));

        final result = await authProvider.login(
          phone: user.phone!,
          password: 'wrong',
        );

        expect(result, isFalse);
        expect(authProvider.status, AuthStatus.unauthenticated);
        expect(authProvider.errorMessage, 'Identifiants invalides.');
        expect(authProvider.isLoading, isFalse);
      },
    );
  });

  group('register', () {
    test('ouvre la session une fois le compte créé', () async {
      when(
        () => authRepository.register(
          name: any(named: 'name'),
          phone: any(named: 'phone'),
          password: any(named: 'password'),
          birthDate: any(named: 'birthDate'),
        ),
      ).thenAnswer((_) async => user);

      final result = await authProvider.register(
        name: 'Awa Moussa',
        phone: '+22790123456',
        password: 'secret12',
        birthDate: DateTime(1998, 4, 2),
      );

      expect(result, isTrue);
      expect(authProvider.status, AuthStatus.authenticated);
    });

    test('expose les erreurs par champ (numéro déjà utilisé)', () async {
      when(
        () => authRepository.register(
          name: any(named: 'name'),
          phone: any(named: 'phone'),
          password: any(named: 'password'),
          birthDate: any(named: 'birthDate'),
        ),
      ).thenThrow(
        const ValidationException('Données invalides.', {
          'phone': 'Ce numéro est déjà utilisé.',
        }),
      );

      final result = await authProvider.register(
        name: 'Awa',
        phone: '+22790123456',
        password: 'secret12',
      );

      expect(result, isFalse);
      expect(authProvider.fieldErrors['phone'], 'Ce numéro est déjà utilisé.');

      authProvider.clearError();
      expect(authProvider.fieldErrors, isEmpty);
      expect(authProvider.errorMessage, isNull);
    });
  });

  group('restoreSession', () {
    test('authenticated si le repository retourne un user', () async {
      when(
        () => authRepository.fetchCurrentUser(),
      ).thenAnswer((_) async => user);

      await authProvider.restoreSession();

      expect(authProvider.status, AuthStatus.authenticated);
      expect(authProvider.currentUser, user);
    });

    test('unauthenticated si aucune session (pas de token stocké)', () async {
      when(
        () => authRepository.fetchCurrentUser(),
      ).thenAnswer((_) async => null);

      await authProvider.restoreSession();

      expect(authProvider.status, AuthStatus.unauthenticated);
    });

    test('unauthenticated si le serveur est injoignable', () async {
      when(
        () => authRepository.fetchCurrentUser(),
      ).thenThrow(const NetworkException());

      await authProvider.restoreSession();

      expect(authProvider.status, AuthStatus.unauthenticated);
    });
  });

  group('déconnexion', () {
    test('logout efface le token et le user courant', () async {
      stubLogin();
      await authProvider.login(phone: user.phone!, password: 'secret1');

      await authProvider.logout();

      expect(authProvider.status, AuthStatus.unauthenticated);
      expect(authProvider.currentUser, isNull);
      verify(() => authRepository.logout()).called(1);
    });

    test(
      'forceLogout (401) repasse en unauthenticated et efface le token',
      () async {
        stubLogin();
        await authProvider.login(phone: user.phone!, password: 'secret1');

        authProvider.forceLogout();

        expect(authProvider.status, AuthStatus.unauthenticated);
        expect(authProvider.currentUser, isNull);
        verify(() => authRepository.logout()).called(1);
      },
    );

    test(
      'forceLogout ne fait rien sans session (ex: mauvais mot de passe)',
      () async {
        // Le 401 d'un mauvais mot de passe arrive alors que la session est
        // déjà fermée : rien à effacer.
        when(
          () => authRepository.login(
            phone: any(named: 'phone'),
            password: any(named: 'password'),
          ),
        ).thenThrow(const UnauthorizedException('Identifiants invalides.'));
        await authProvider.login(phone: user.phone!, password: 'mauvais');

        authProvider.forceLogout();

        verifyNever(() => authRepository.logout());
        expect(authProvider.errorMessage, 'Identifiants invalides.');
      },
    );
  });
}
