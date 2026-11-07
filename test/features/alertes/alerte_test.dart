import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/errors/app_exception.dart';
import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/features/alertes/data/alerte_repository.dart';
import 'package:lahiyarouwa/features/alertes/providers/alerte_provider.dart';
import 'package:lahiyarouwa/features/contractions/data/contraction_repository.dart';
import 'package:lahiyarouwa/features/contractions/providers/contraction_provider.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockAlerteRepository extends Mock implements AlerteRepository {}

class MockContractionRepository extends Mock implements ContractionRepository {}

Response<dynamic> ok(dynamic data) => Response(
  requestOptions: RequestOptions(path: ''),
  data: data,
);

void main() {
  late MockApiClient api;

  setUp(() {
    api = MockApiClient();
    when(
      () => api.post(any(), data: any(named: 'data')),
    ).thenAnswer((_) async => ok({}));
  });

  group('AlerteRepository', () {
    test('envoie le signe et omet des précisions vides', () async {
      await AlerteRepository(api).signal(signe: 'Forte fièvre', details: '   ');

      verify(
        () => api.post('/alertes', data: {'signe': 'Forte fièvre'}),
      ).called(1);
    });

    test('envoie les précisions nettoyées', () async {
      await AlerteRepository(
        api,
      ).signal(signe: 'Autre signe', details: '  Depuis hier ');

      verify(
        () => api.post(
          '/alertes',
          data: {'signe': 'Autre signe', 'details': 'Depuis hier'},
        ),
      ).called(1);
    });
  });

  test('AlerteProvider expose l\'erreur si l\'envoi échoue', () async {
    final repository = MockAlerteRepository();
    when(
      () => repository.signal(
        signe: any(named: 'signe'),
        details: any(named: 'details'),
      ),
    ).thenThrow(const NetworkException());
    final provider = AlerteProvider(repository);

    final sent = await provider.signal('Convulsions');

    expect(sent, isFalse);
    expect(provider.errorMessage, isNotNull);
    expect(provider.isSending, isFalse);
  });

  test('ContractionRepository envoie les instants en UTC', () async {
    final debut = DateTime.utc(2026, 11, 7, 10);
    await ContractionRepository(api).saveSession(
      debut: debut,
      fin: debut.add(const Duration(minutes: 30)),
      contractions: [
        (debut: debut, fin: debut.add(const Duration(seconds: 45))),
      ],
    );

    final data =
        verify(
              () => api.post('/contractions', data: captureAny(named: 'data')),
            ).captured.single
            as Map<String, dynamic>;
    expect(data['debut'], '2026-11-07T10:00:00.000Z');
    expect(
      (data['contractions'] as List).single['fin'],
      '2026-11-07T10:00:45.000Z',
    );
  });

  test(
    'ContractionProvider renvoie true une fois la séance enregistrée',
    () async {
      final repository = MockContractionRepository();
      when(
        () => repository.saveSession(
          debut: any(named: 'debut'),
          fin: any(named: 'fin'),
          contractions: any(named: 'contractions'),
        ),
      ).thenAnswer((_) async {});
      registerFallbackValue(DateTime(2026));
      final provider = ContractionProvider(repository);

      final saved = await provider.saveSession(
        debut: DateTime(2026),
        fin: DateTime(2026),
        contractions: const [],
      );

      expect(saved, isTrue);
    },
  );
}
