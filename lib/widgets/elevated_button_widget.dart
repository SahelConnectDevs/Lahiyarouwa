import 'package:flutter/material.dart';

class ElevatedButtonWidget extends StatelessWidget {
  final double height;
  final double width;
  final WidgetStateProperty<Color?> backgroundColor;
  final WidgetStateProperty<Color?> foregroundColor;
  final OutlinedBorder shape;
  final WidgetStateProperty<BorderSide?> side;
  final String text;
  final Widget icon;
  final VoidCallback? onPressed;

  const ElevatedButtonWidget({
    super.key,
    required this.height,
    required this.width,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.shape,
    required this.side,
    required this.text,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: width,
      child: ElevatedButton(
        onPressed: onPressed,

        style: ButtonStyle(
          alignment: Alignment.center,

          backgroundColor: backgroundColor,

          foregroundColor: foregroundColor,

          side: side,

          shape: WidgetStatePropertyAll(shape),

          overlayColor: WidgetStatePropertyAll(
            Colors.white.withValues(alpha: 0.15),
          ),
          animationDuration: const Duration(milliseconds: 150),
        ),

        child: Stack(
          alignment: Alignment.center,
          children: [
            Align(
              alignment: Alignment.center,
              child: Text(
                text,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            Align(alignment: Alignment.centerRight, child: icon),
          ],
        ),
      ),
    );
  }
}
