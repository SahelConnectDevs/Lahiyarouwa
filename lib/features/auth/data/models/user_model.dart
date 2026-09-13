/// Utilisateur authentifié, tel que renvoyé par `/auth/login` et `/auth/me`.
class UserModel {
  const UserModel({required this.id, required this.email, required this.name});

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      UserModel(id: json['id'].toString(), email: json['email'] as String, name: json['name'] as String);

  final String id;
  final String email;
  final String name;
}
