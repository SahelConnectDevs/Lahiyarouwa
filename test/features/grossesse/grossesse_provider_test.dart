import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:lahiyarouwa/core/errors/app_exception.dart';
import 'package:lahiyarouwa/core/utils/load_status.dart';
import 'package:lahiyarouwa/features/grossesse/data/grossesse_repository.dart';
import 'package:lahiyarouwa/features/grossesse/data/models/cpn_visit_model.dart';
import 'package:lahiyarouwa/features/grossesse/data/models/pregnancy_model.dart';
import 'package:lahiyarouwa/features/grossesse/providers/grossesse_provider.dart';

class MockGrossesseRepository extends Mock implements GrossesseRepository {}

void main() {
  late MockGrossesseRepository repository;
  late GrossesseProvider provider;

  final pregnancy = PregnancyModel(
    id: 'p1',
    ddr: DateTime(2026, 6, 1),
    termePrevu: DateTime(2027, 3, 8),
    semaine: 22,
    jour: 5,
    joursRestants: 121,
    trimestre: 2,
  );
  const cpn = [
    CpnVisitModel(
      numero: 1,
      titre: 'CPN 1',
      periode: 'Avant 12 semaines',
      statut: CpnStatus.effectuee,
    ),
    CpnVisitModel(
      numero: 2,
      titre: 'CPN 2',
      periode: '14 – 20 semaines',
      statut: CpnStatus.enRetard,
    ),
    CpnVisitModel(
      numero: 3,
      titre: 'CPN 3',
      periode: '24 – 28 semaines',
      statut: CpnStatus.aVenir,
    ),
  ];

  setUpAll(() => registerFallbackValue(DateTime(2026)));

  setUp(() {
    repository = MockGrossesseRepository();
    provider = GrossesseProvider(repository);
  });

  group('load', () {
    test('charge la grossesse puis ses CPN', () async {
      when(() => repository.fetchCurrent()).thenAnswer((_) async => pregnancy);
      when(() => repository.fetchCpn()).thenAnswer((_) async => cpn);

      await provider.load();

      expect(provider.status, LoadStatus.loaded);
      expect(provider.hasPregnancy, isTrue);
      expect(provider.cpnDoneCount, 1);
      expect(provider.nextCpn?.numero, 2);
    });

    test('sans grossesse : pas d\'appel aux CPN', () async {
      when(() => repository.fetchCurrent()).thenAnswer((_) async => null);

      await provider.load();

      expect(provider.status, LoadStatus.loaded);
      expect(provider.hasPregnancy, isFalse);
      verifyNever(() => repository.fetchCpn());
    });

    test('erreur réseau : status error avec message', () async {
      when(() => repository.fetchCurrent()).thenThrow(const NetworkException());

      await provider.load();

      expect(provider.status, LoadStatus.error);
      expect(provider.errorMessage, isNotNull);
    });
  });

  group('setDdr', () {
    test('enregistre la grossesse et recharge les CPN', () async {
      when(() => repository.setDdr(any())).thenAnswer((_) async => pregnancy);
      when(() => repository.fetchCpn()).thenAnswer((_) async => cpn);

      final ok = await provider.setDdr(DateTime(2026, 6, 1));

      expect(ok, isTrue);
      expect(provider.pregnancy, pregnancy);
      expect(provider.cpn, hasLength(3));
      expect(provider.isSaving, isFalse);
    });

    test('affiche le message de validation de la DDR', () async {
      when(() => repository.setDdr(any())).thenThrow(
        const ValidationException('Données invalides.', {
          'ddr':
              'La date des dernières règles doit dater de moins de 44 semaines.',
        }),
      );

      final ok = await provider.setDdr(DateTime(2025));

      expect(ok, isFalse);
      expect(provider.errorMessage, contains('44 semaines'));
    });
  });

  test('markCpn remplace la CPN mise à jour dans la liste', () async {
    when(() => repository.fetchCurrent()).thenAnswer((_) async => pregnancy);
    when(() => repository.fetchCpn()).thenAnswer((_) async => cpn);
    await provider.load();
    when(() => repository.markCpn(2, effectuee: true)).thenAnswer(
      (_) async => const CpnVisitModel(
        numero: 2,
        titre: 'CPN 2',
        periode: '14 – 20 semaines',
        statut: CpnStatus.effectuee,
      ),
    );

    final ok = await provider.markCpn(2, effectuee: true);

    expect(ok, isTrue);
    expect(provider.cpnDoneCount, 2);
    expect(provider.nextCpn?.numero, 3);
  });

  test('reset vide tout (déconnexion)', () async {
    when(() => repository.fetchCurrent()).thenAnswer((_) async => pregnancy);
    when(() => repository.fetchCpn()).thenAnswer((_) async => cpn);
    await provider.load();
    provider.skipDdr();

    provider.reset();

    expect(provider.status, LoadStatus.initial);
    expect(provider.pregnancy, isNull);
    expect(provider.cpn, isEmpty);
    expect(provider.ddrSkipped, isFalse);
  });
}
