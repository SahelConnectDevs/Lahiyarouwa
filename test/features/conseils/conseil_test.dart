import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/core/utils/load_status.dart';
import 'package:lahiyarouwa/features/conseils/data/conseil_repository.dart';
import 'package:lahiyarouwa/features/conseils/data/models/conseil_model.dart';
import 'package:lahiyarouwa/features/conseils/providers/conseil_provider.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockConseilRepository extends Mock implements ConseilRepository {}

Response<dynamic> ok(dynamic data) => Response(
  requestOptions: RequestOptions(path: ''),
  data: data,
);

void main() {
  test('ConseilRepository filtre par semaine seulement si fournie', () async {
    final api = MockApiClient();
    final repository = ConseilRepository(api);
    when(
      () =>
          api.get('/conseils', queryParameters: any(named: 'queryParameters')),
    ).thenAnswer(
      (_) async => ok([
        {
          'id': 'c1',
          'titre': 'Buvez',
          'contenu': '8 verres',
          'categorie': 'grossesse',
          'icone': 'water_drop',
        },
      ]),
    );

    final conseils = await repository.fetch(semaine: 22);
    await repository.fetch();

    expect(conseils.single.icone, 'water_drop');
    verify(
      () => api.get(
        '/conseils',
        queryParameters: {'langue': 'fr', 'semaine': 22},
      ),
    ).called(1);
    verify(
      () => api.get('/conseils', queryParameters: {'langue': 'fr'}),
    ).called(1);
  });

  group('ConseilProvider', () {
    late MockConseilRepository repository;
    late ConseilProvider provider;

    const conseils = [
      ConseilModel(id: 'a', titre: 'A', contenu: 'a', categorie: 'general'),
      ConseilModel(id: 'b', titre: 'B', contenu: 'b', categorie: 'general'),
    ];

    setUp(() {
      repository = MockConseilRepository();
      provider = ConseilProvider(repository);
      when(
        () => repository.fetch(semaine: any(named: 'semaine')),
      ).thenAnswer((_) async => conseils);
    });

    test('le conseil du jour change d\'un jour à l\'autre', () async {
      await provider.load(semaine: 22);

      expect(provider.status, LoadStatus.loaded);
      final day1 = provider.conseilDuJour(now: DateTime(2026, 11, 7));
      final day2 = provider.conseilDuJour(now: DateTime(2026, 11, 8));
      expect(day1, isNot(day2));
    });

    test('refresh réutilise la semaine du dernier chargement', () async {
      await provider.load(semaine: 22);
      await provider.refresh();

      verify(() => repository.fetch(semaine: 22)).called(2);
    });

    test('aucun conseil du jour sans conseils', () {
      expect(provider.conseilDuJour(), isNull);
    });
  });
}
