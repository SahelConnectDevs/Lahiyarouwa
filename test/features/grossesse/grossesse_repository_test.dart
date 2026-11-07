import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/features/grossesse/data/grossesse_repository.dart';
import 'package:lahiyarouwa/features/grossesse/data/models/cpn_visit_model.dart';

class MockApiClient extends Mock implements ApiClient {}

Response<dynamic> ok(dynamic data) => Response(
  requestOptions: RequestOptions(path: ''),
  data: data,
);

const pregnancyJson = {
  'id': 'p1',
  'ddr': '2026-06-01T00:00:00.000Z',
  'status': 'en_cours',
  'dateAccouchement': null,
  'termePrevu': '2027-03-08T00:00:00.000Z',
  'semaine': 22,
  'jour': 5,
  'joursRestants': 121,
  'trimestre': 2,
};

void main() {
  late MockApiClient api;
  late GrossesseRepository repository;

  setUp(() {
    api = MockApiClient();
    repository = GrossesseRepository(api);
  });

  test('fetchCurrent renvoie null sans grossesse déclarée', () async {
    when(() => api.get('/grossesse')).thenAnswer((_) async => ok(null));
    expect(await repository.fetchCurrent(), isNull);
  });

  test('fetchCurrent lit les valeurs calculées par l\'API', () async {
    when(
      () => api.get('/grossesse'),
    ).thenAnswer((_) async => ok(pregnancyJson));

    final pregnancy = (await repository.fetchCurrent())!;

    expect(pregnancy.semaine, 22);
    expect(pregnancy.jour, 5);
    expect(pregnancy.trimestre, 2);
    expect(pregnancy.semainesRestantes, 18);
    expect(pregnancy.progression, closeTo(159 / 280, 1e-9));
  });

  test('setDdr envoie la DDR en date seule', () async {
    when(
      () => api.put('/grossesse', data: any(named: 'data')),
    ).thenAnswer((_) async => ok(pregnancyJson));

    await repository.setDdr(DateTime(2026, 6, 1));

    verify(() => api.put('/grossesse', data: {'ddr': '2026-06-01'})).called(1);
  });

  test('fetchCpn lit statut, fenêtre et listes', () async {
    when(() => api.get('/grossesse/cpn')).thenAnswer(
      (_) async => ok([
        {
          'numero': 1,
          'titre': 'Première consultation',
          'periode': 'Avant 12 semaines',
          'examens': ['Tension'],
          'aApporter': ['Carnet'],
          'fenetre': {
            'debut': '2026-06-01T00:00:00.000Z',
            'fin': '2026-08-23T00:00:00.000Z',
          },
          'statut': 'effectuee',
          'effectueeLe': '2026-07-02T00:00:00.000Z',
          'notes': null,
        },
        {
          'numero': 8,
          'titre': 'Post-natale',
          'periode': 'Après l’accouchement',
          'examens': [],
          'aApporter': [],
          'fenetre': null,
          'statut': 'a_venir',
          'effectueeLe': null,
          'notes': null,
        },
      ]),
    );

    final visits = await repository.fetchCpn();

    expect(visits.first.statut, CpnStatus.effectuee);
    expect(visits.first.isDone, isTrue);
    expect(visits.first.examens, ['Tension']);
    expect(visits.first.fenetreDebut, isNotNull);
    expect(visits.last.fenetreDebut, isNull);
    expect(visits.last.statut, CpnStatus.aVenir);
  });

  test('markCpn appelle la bonne route', () async {
    when(
      () => api.put('/grossesse/cpn/3', data: any(named: 'data')),
    ).thenAnswer(
      (_) async => ok({
        'numero': 3,
        'titre': 'CPN 3',
        'periode': '24 – 28 semaines',
        'statut': 'effectuee',
      }),
    );

    final visit = await repository.markCpn(3, effectuee: true);

    expect(visit.isDone, isTrue);
    verify(
      () => api.put('/grossesse/cpn/3', data: {'effectuee': true}),
    ).called(1);
  });
}
