import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/errors/app_exception.dart';
import 'package:lahiyarouwa/core/network/api_client.dart';
import 'package:lahiyarouwa/core/utils/load_status.dart';
import 'package:lahiyarouwa/features/vaccination/data/models/vaccine_entry_model.dart';
import 'package:lahiyarouwa/features/vaccination/data/vaccination_repository.dart';
import 'package:lahiyarouwa/features/vaccination/providers/vaccination_provider.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockVaccinationRepository extends Mock implements VaccinationRepository {}

Response<dynamic> ok(dynamic data) => Response(
  requestOptions: RequestOptions(path: ''),
  data: data,
);

void main() {
  setUpAll(() => registerFallbackValue(DateTime(2026)));

  group('VaccinationRepository', () {
    late MockApiClient api;
    late VaccinationRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = VaccinationRepository(api);
    });

    test('lit le calendrier de la maman avec la dose reçue', () async {
      when(() => api.get('/vaccinations/calendrier')).thenAnswer(
        (_) async => ok([
          {
            'vaccin': {
              'id': 'v1',
              'nom': 'VAT',
              'dose': 'Dose 1',
              'moment': 'Dès le 1er contact',
            },
            'datePrevue': null,
            'statut': 'fait',
            'doseRecue': {'id': 'r1', 'date': '2026-07-02T00:00:00.000Z'},
          },
          {
            'vaccin': {'id': 'v2', 'nom': 'VAT', 'moment': '4 semaines après'},
            'datePrevue': null,
            'statut': 'a_venir',
            'doseRecue': null,
          },
        ]),
      );

      final calendar = await repository.fetchMotherCalendar();

      expect(calendar.first.isDone, isTrue);
      expect(calendar.first.recueLe, isNotNull);
      expect(calendar.last.statut, VaccineStatus.aVenir);
      expect(calendar.last.dose, isNull);
    });

    test('enregistre une dose avec l\'id du vaccin', () async {
      when(
        () => api.post('/vaccinations', data: any(named: 'data')),
      ).thenAnswer((_) async => ok({}));

      await repository.recordDose(vaccinId: 'v2', date: DateTime(2026, 8, 3));

      verify(
        () => api.post(
          '/vaccinations',
          data: {'vaccin': 'v2', 'date': '2026-08-03'},
        ),
      ).called(1);
    });
  });

  group('VaccinationProvider', () {
    late MockVaccinationRepository repository;
    late VaccinationProvider provider;

    const done = VaccineEntryModel(
      vaccinId: 'v1',
      nom: 'VAT 1',
      moment: 'Dès le 1er contact',
      statut: VaccineStatus.fait,
    );
    const pending = VaccineEntryModel(
      vaccinId: 'v2',
      nom: 'VAT 2',
      moment: '4 semaines après',
      statut: VaccineStatus.aVenir,
    );

    setUp(() {
      repository = MockVaccinationRepository();
      provider = VaccinationProvider(repository);
    });

    test('compte les vaccins faits / à suivre et donne le prochain', () async {
      when(
        () => repository.fetchMotherCalendar(),
      ).thenAnswer((_) async => [done, pending]);

      await provider.load();

      expect(provider.status, LoadStatus.loaded);
      expect(provider.doneCount, 1);
      expect(provider.pendingCount, 1);
      expect(provider.next?.vaccinId, 'v2');
    });

    test('recordDose recharge le calendrier', () async {
      when(
        () => repository.recordDose(
          vaccinId: any(named: 'vaccinId'),
          date: any(named: 'date'),
        ),
      ).thenAnswer((_) async {});
      when(
        () => repository.fetchMotherCalendar(),
      ).thenAnswer((_) async => [done]);

      final ok = await provider.recordDose('v2', DateTime(2026, 8, 3));

      expect(ok, isTrue);
      expect(provider.next, isNull);
    });

    test('erreur : message exposé, status error', () async {
      when(
        () => repository.fetchMotherCalendar(),
      ).thenThrow(const ServerException('Erreur serveur', statusCode: 500));

      await provider.load();

      expect(provider.status, LoadStatus.error);
      expect(provider.errorMessage, 'Erreur serveur');
    });
  });
}
