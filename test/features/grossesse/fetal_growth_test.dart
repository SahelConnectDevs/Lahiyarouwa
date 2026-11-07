import 'package:flutter_test/flutter_test.dart';

import 'package:lahiyarouwa/features/grossesse/data/fetal_growth.dart';

void main() {
  test('valeurs de référence d\'une semaine pleine', () {
    final s12 = FetalGrowth.at(12);
    expect(s12.tailleLabel, '5,4 cm');
    expect(s12.poidsLabel, '14 g');
    expect(s12.comparaison, 'un citron vert');

    final s32 = FetalGrowth.at(32);
    expect(s32.poidsLabel, '1,7 kg');
  });

  test('interpole jour par jour entre deux semaines', () {
    final mid = FetalGrowth.at(16, 3);
    expect(mid.poidsG, closeTo(100 + (140 - 100) * 3 / 7, 1e-9));
    expect(mid.semaine, 16);
  });

  test('l\'illustration grandit sans jamais rétrécir, jusqu\'à 1 au terme', () {
    var previous = 0.0;
    for (var semaine = 4; semaine <= 42; semaine++) {
      for (var jour = 0; jour < 7; jour++) {
        final echelle = FetalGrowth.at(semaine, jour).echelle;
        expect(echelle, greaterThanOrEqualTo(previous));
        previous = echelle;
      }
    }
    expect(FetalGrowth.at(4).echelle, FetalGrowth.minScale);
    expect(FetalGrowth.at(42).echelle, 1.0);
  });

  test('pas de saut de taille entre 19 et 20 SA pendant la semaine 19', () {
    expect(FetalGrowth.at(19, 6).tailleCm, FetalGrowth.at(19).tailleCm);
  });

  test('bornes : avant 4 SA et après 42 SA', () {
    expect(FetalGrowth.at(1).semaine, 4);
    expect(FetalGrowth.at(1).poidsLabel, '< 1 g');
    expect(FetalGrowth.at(45, 3).semaine, 42);
  });

  test('chaque comparaison commence par un/une (« de la taille d’une… »)', () {
    for (var semaine = 4; semaine <= 42; semaine++) {
      expect(FetalGrowth.at(semaine).comparaison, matches(RegExp(r'^une? ')));
    }
  });
}
