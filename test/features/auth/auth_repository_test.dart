import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/features/auth/data/auth_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

Response<dynamic> ok(dynamic data) => Response(
  requestOptions: RequestOptions(path: ''),
  data: data,
);

void main() {
  late MockApiClient api;
  late AuthRepository repository;

  const session = {
    'token': 'jwt',
    'user': {
      'id': 'u1',
      'name': 'Awa',
      'phone': '+22790123456',
      'role': 'user',
    },
  };

  setUp(() {
    api = MockApiClient();
    repository = AuthRepository(api);
    when(() => api.saveToken(any())).thenAnswer((_) async {});
  });

  test('login envoie le téléphone et stocke le token', () async {
    when(
      () => api.post('/auth/login', data: any(named: 'data')),
    ).thenAnswer((_) async => ok(session));

    final user = await repository.login(
      phone: '+22790123456',
      password: 'secret1',
    );

    expect(user.id, 'u1');
    expect(user.phone, '+22790123456');
    verify(
      () => api.post(
        '/auth/login',
        data: {'phone': '+22790123456', 'password': 'secret1'},
      ),
    ).called(1);
    verify(() => api.saveToken('jwt')).called(1);
  });

  test('register envoie la date de naissance au format date seule', () async {
    when(
      () => api.post('/auth/register', data: any(named: 'data')),
    ).thenAnswer((_) async => ok(session));

    await repository.register(
      name: 'Awa',
      phone: '+22790123456',
      password: 'secret12',
      birthDate: DateTime(1998, 4, 2),
    );

    final data =
        verify(
              () => api.post('/auth/register', data: captureAny(named: 'data')),
            ).captured.single
            as Map<String, dynamic>;
    expect(data['birthDate'], '1998-04-02');
    expect(data['name'], 'Awa');
    verify(() => api.saveToken('jwt')).called(1);
  });

  test('fetchCurrentUser ne fait pas d\'appel sans token', () async {
    when(() => api.readToken()).thenAnswer((_) async => null);

    expect(await repository.fetchCurrentUser(), isNull);
    verifyNever(() => api.get(any()));
  });
}
