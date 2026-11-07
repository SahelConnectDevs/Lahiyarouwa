/// Utilisateur authentifié, tel que renvoyé par `/auth/login` et `/auth/me`.
///
/// Le backend identifie les comptes par téléphone : [email] est donc
/// facultatif (null pour un compte créé uniquement avec un numéro).
class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.role = 'user',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'].toString(),
    name: json['name'] as String,
    phone: json['phone'] as String?,
    email: json['email'] as String?,
    role: (json['role'] as String?) ?? 'user',
  );

  final String id;
  final String name;

  /// Numéro au format international, ex: `+22790123456`.
  final String? phone;
  final String? email;

  /// `user`, `relais` ou `admin`.
  final String role;
}
