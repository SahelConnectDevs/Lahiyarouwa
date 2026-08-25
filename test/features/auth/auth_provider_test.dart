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

  const user = UserModel(id: '1', email: 'awa@example.com', name: 'Awa');

  setUp(() {
    authRepository = MockAuthRepository();
    authProvider = AuthProvider(authRepository);
  });

  group('login', () {
    test('passe en authenticated et stocke le user en cas de succès', () async {
      when(
        () => authRepository.login(email: any(named: 'email'), password: any(named: 'password')),
      ).thenAnswer((_) async => user);

      final result = await authProvider.login(email: user.email, password: 'secret1');

      expect(result, isTrue);
      expect(authProvider.status, AuthStatus.authenticated);
      expect(authProvider.currentUser, user);
      expect(authProvider.errorMessage, isNull);
    });

    test('reste unauthenticated et expose le message en cas d\'erreur serveur', () async {
      when(
        () => authRepository.login(email: any(named: 'email'), password: any(named: 'password')),
      ).thenThrow(const ServerException('Identifiants invalides', statusCode: 401));

      final result = await authProvider.login(email: user.email, password: 'wrong');

      expect(result, isFalse);
      expect(authProvider.status, AuthStatus.unauthenticated);
      expect(authProvider.errorMessage, 'Identifiants invalides');
    });
  });

  group('restoreSession', () {
    test('authenticated si le repository retourne un user', () async {
      when(() => authRepository.fetchCurrentUser()).thenAnswer((_) async => user);

      await authProvider.restoreSession();

      expect(authProvider.status, AuthStatus.authenticated);
      expect(authProvider.currentUser, user);
    });

    test('unauthenticated si aucune session (pas de token stocké)', () async {
      when(() => authRepository.fetchCurrentUser()).thenAnswer((_) async => null);

      await authProvider.restoreSession();

      expect(authProvider.status, AuthStatus.unauthenticated);
    });
  });

  group('forceLogout', () {
    test('repasse en unauthenticated et efface le user courant', () async {
      when(
        () => authRepository.login(email: any(named: 'email'), password: any(named: 'password')),
      ).thenAnswer((_) async => user);
      await authProvider.login(email: user.email, password: 'secret1');

      authProvider.forceLogout();

      expect(authProvider.status, AuthStatus.unauthenticated);
      expect(authProvider.currentUser, isNull);
    });
  });
}
