import 'package:flutter/material.dart';
import 'package:intl_phone_field/country_picker_dialog.dart';
import 'package:intl_phone_field/intl_phone_field.dart';

/// Champ de numéro de téléphone avec sélecteur de pays (`intl_phone_field`),
/// partagé par la connexion et l'inscription.
///
/// Le Niger (+227, 8 chiffres) est sélectionné par défaut. La longueur du
/// numéro est vérifiée selon le pays choisi, et [onChanged] reçoit le numéro
/// complet au format international (ex: `+22790123456`), qui est exactement
/// le format attendu par le backend (voir `backend/src/utils/phone.ts`).
class PhoneFieldWidget extends StatelessWidget {
  const PhoneFieldWidget({
    super.key,
    required this.onChanged,
    this.textInputAction = TextInputAction.next,
  });

  /// Appelé à chaque saisie avec le numéro complet, indicatif compris.
  final ValueChanged<String> onChanged;
  final TextInputAction textInputAction;

  static const _pink = Color(0xFFD81B60);

  @override
  Widget build(BuildContext context) {
    return IntlPhoneField(
      initialCountryCode: 'NE',
      languageCode: 'fr',
      invalidNumberMessage: 'Numéro de téléphone invalide',
      textInputAction: textInputAction,
      cursorColor: _pink,
      dropdownIconPosition: IconPosition.trailing,
      flagsButtonPadding: const EdgeInsets.only(left: 12),
      decoration: InputDecoration(
        labelText: 'Numéro de téléphone',
        counterText: '',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _pink, width: 1.6),
        ),
      ),
      pickerDialogStyle: PickerDialogStyle(
        backgroundColor: Colors.white,
        searchFieldCursorColor: _pink,
        searchFieldInputDecoration: const InputDecoration(
          labelText: 'Rechercher un pays',
          prefixIcon: Icon(Icons.search),
        ),
      ),
      onChanged: (phone) => onChanged(phone.completeNumber),
    );
  }
}
