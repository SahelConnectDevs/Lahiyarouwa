import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lahiyarouwa/widgets/phone_field_widget.dart';

void main() {
  late GlobalKey<FormState> formKey;
  late String number;

  Future<void> pumpField(WidgetTester tester) async {
    formKey = GlobalKey<FormState>();
    number = '';
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Form(
            key: formKey,
            child: PhoneFieldWidget(onChanged: (value) => number = value),
          ),
        ),
      ),
    );
  }

  testWidgets('affiche le Niger (+227) par défaut', (tester) async {
    await pumpField(tester);

    expect(find.text('Numéro de téléphone'), findsOneWidget);
    expect(find.text('+227'), findsOneWidget);
  });

  testWidgets('renvoie le numéro complet au format international', (
    tester,
  ) async {
    await pumpField(tester);

    await tester.enterText(find.byType(TextFormField), '90123456');
    await tester.pump();

    expect(number, '+22790123456');
  });

  testWidgets('refuse un numéro trop court pour le pays choisi', (
    tester,
  ) async {
    await pumpField(tester);

    await tester.enterText(find.byType(TextFormField), '9012');
    expect(formKey.currentState!.validate(), isFalse);
    await tester.pump();

    expect(find.text('Numéro de téléphone invalide'), findsOneWidget);
  });

  testWidgets('accepte un numéro nigérien à 8 chiffres', (tester) async {
    await pumpField(tester);

    await tester.enterText(find.byType(TextFormField), '90123456');
    await tester.pump();

    expect(formKey.currentState!.validate(), isTrue);
  });
}
