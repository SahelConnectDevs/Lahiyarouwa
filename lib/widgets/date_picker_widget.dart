import 'package:flutter/material.dart';

class DatePickerWidget extends StatefulWidget {
  final DateTime? initialDate;
  final ValueChanged<DateTime> onDateSelected;

  const DatePickerWidget({
    super.key,
    this.initialDate,
    required this.onDateSelected,
  });

  @override
  State<DatePickerWidget> createState() => _DatePickerWidgetState();
}

class _DatePickerWidgetState extends State<DatePickerWidget> {
  static const Color primaryColor = Color(0xFFD81B60);

  final List<String> months = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sept',
    'Oct',
    'Nov',
    'Déc',
  ];

  late int selectedDay;
  late int selectedMonth;
  late int selectedYear;

  late FixedExtentScrollController monthController;
  late FixedExtentScrollController dayController;
  late FixedExtentScrollController yearController;

  @override
  void initState() {
    super.initState();

    final date = widget.initialDate ?? DateTime(2000, 1, 1);

    selectedDay = date.day;
    selectedMonth = date.month;
    selectedYear = date.year;

    monthController = FixedExtentScrollController(
      initialItem: selectedMonth - 1,
    );

    dayController = FixedExtentScrollController(initialItem: selectedDay - 1);

    yearController = FixedExtentScrollController(
      initialItem: selectedYear - 1900,
    );
  }

  @override
  void dispose() {
    monthController.dispose();
    dayController.dispose();
    yearController.dispose();
    super.dispose();
  }

  // Nombre de jours du mois
  int daysInMonth(int year, int month) {
    return DateTime(year, month + 1, 0).day;
  }

  // Vérifie que le jour existe dans le mois sélectionné
  void correctDay() {
    final maxDay = daysInMonth(selectedYear, selectedMonth);

    if (selectedDay > maxDay) {
      selectedDay = maxDay;

      dayController.jumpToItem(selectedDay - 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentYear = DateTime.now().year;

    return Container(
      height: 235,
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      child: Column(
        children: [
          // =====================================================
          // EN-TÊTE
          // =====================================================
          SizedBox(
            height: 42,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // ANNULER
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Annuler',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),

                  // TITRE
                  const Text(
                    'Date de naissance',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),

                  // DÉFINIR
                  TextButton(
                    onPressed: () {
                      final date = DateTime(
                        selectedYear,
                        selectedMonth,
                        selectedDay,
                      );

                      widget.onDateSelected(date);

                      Navigator.pop(context);
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Définir',
                      style: TextStyle(
                        fontSize: 12,
                        color: primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const Divider(height: 1, thickness: 0.5),

          // =====================================================
          // ROULETTES
          // =====================================================
          SizedBox(
            height: 160,
            child: Row(
              children: [
                // =================================================
                // MOIS
                // =================================================
                Expanded(
                  child: _buildWheel(
                    controller: monthController,
                    itemCount: 12,
                    initialIndex: selectedMonth - 1,
                    itemBuilder: (index) {
                      return months[index % 12];
                    },
                    onChanged: (index) {
                      setState(() {
                        selectedMonth = (index % 12) + 1;

                        correctDay();
                      });
                    },
                  ),
                ),

                // =================================================
                // JOUR
                // =================================================
                Expanded(
                  child: _buildWheel(
                    controller: dayController,
                    itemCount: 31,
                    initialIndex: selectedDay - 1,
                    itemBuilder: (index) {
                      return '${(index % 31) + 1}';
                    },
                    onChanged: (index) {
                      setState(() {
                        selectedDay = (index % 31) + 1;
                      });
                    },
                  ),
                ),

                // =================================================
                // ANNÉE
                // =================================================
                Expanded(
                  child: _buildWheel(
                    controller: yearController,
                    itemCount: currentYear - 1900 + 1,
                    initialIndex: selectedYear - 1900,
                    itemBuilder: (index) {
                      return '${1900 + index}';
                    },
                    onChanged: (index) {
                      setState(() {
                        selectedYear = 1900 + index;

                        correctDay();
                      });
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================
  // WIDGET ROULETTE
  // ===========================================================

  Widget _buildWheel({
    required FixedExtentScrollController controller,
    required int itemCount,
    required int initialIndex,
    required String Function(int) itemBuilder,
    required ValueChanged<int> onChanged,
  }) {
    return ListWheelScrollView.useDelegate(
      controller: controller,

      // Hauteur d'un élément
      itemExtent: 30,

      // Permet d'avoir :
      // 2 éléments en haut
      // 1 au milieu
      // 2 en bas
      diameterRatio: 1.5,

      perspective: 0.002,

      physics: const FixedExtentScrollPhysics(),

      onSelectedItemChanged: onChanged,

      overAndUnderCenterOpacity: 0.35,

      childDelegate: ListWheelChildLoopingListDelegate(
        children: List.generate(itemCount, (index) {
          return Center(
            child: Text(
              itemBuilder(index),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
          );
        }),
      ),
    );
  }
}
