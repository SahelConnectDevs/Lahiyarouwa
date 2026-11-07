import 'package:flutter_test/flutter_test.dart';

import 'package:lahiyarouwa/core/utils/dates.dart';

void main() {
  test('toApiDate : date seule pour un jour passé', () {
    expect(
      Dates.toApiDate(DateTime(2026, 3, 4), now: DateTime(2026, 11, 7)),
      '2026-03-04',
    );
  });

  test('toApiDate : instant précis pour aujourd\'hui (pas de faux futur)', () {
    final now = DateTime(2026, 11, 7, 0, 30);
    expect(
      Dates.toApiDate(DateTime(2026, 11, 7), now: now),
      now.toUtc().toIso8601String(),
    );
  });

  test('formats français', () {
    final date = DateTime(2026, 8, 3);
    expect(Dates.long(date), '3 août 2026');
    expect(Dates.short(date), '03/08/2026');
  });

  test('daysFromToday ignore l\'heure', () {
    expect(
      Dates.daysFromToday(
        DateTime(2026, 11, 15, 8),
        now: DateTime(2026, 11, 7, 23),
      ),
      8,
    );
  });

  test('parse ramène une date ISO en heure locale, null sinon', () {
    expect(Dates.parse('2026-11-07T10:00:00.000Z')!.isUtc, isFalse);
    expect(Dates.parse(null), isNull);
  });
}
