import 'package:flutter/material.dart';

/// Bandeau d'erreur renvoyée par l'API (identifiants invalides, réseau...),
/// partagé par les formulaires.
class ErrorBannerWidget extends StatelessWidget {
  const ErrorBannerWidget({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: const Color(0xFFFFEBEE),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        const Icon(Icons.error_outline, color: Color(0xFFC62828), size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            message,
            style: const TextStyle(color: Color(0xFFC62828), fontSize: 13),
          ),
        ),
      ],
    ),
  );
}
