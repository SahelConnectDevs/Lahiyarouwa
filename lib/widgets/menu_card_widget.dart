import 'package:flutter/material.dart';

class MenuCardWidget extends StatelessWidget {
  const MenuCardWidget({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        height: 104,
        padding: const EdgeInsets.all(12),

        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),

          border: Border.all(color: const Color(0xFFF3E7EE), width: 1),

          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),

        child: Stack(
          children: [
            // Icône
            Container(
              width: 48,
              height: 48,

              decoration: BoxDecoration(
                color: const Color(0xFFFFE7F0),
                borderRadius: BorderRadius.circular(16),
              ),

              child: Icon(icon, size: 27, color: const Color(0xFFD81B60)),
            ),

            // Flèche
            const Positioned(
              right: 0,
              top: 25,

              child: Icon(
                Icons.arrow_forward_ios_rounded,
                size: 15,
                color: Color(0xFF374151),
              ),
            ),

            // Texte
            Positioned(
              left: 0,
              bottom: 1,

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF172033),
                    ),
                  ),

                  const SizedBox(height: 2),

                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF7A8190),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
