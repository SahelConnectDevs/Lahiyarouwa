class HydratationModel {
  final int verres;
  final int objectif;

  HydratationModel({required this.verres, required this.objectif});

  double get progression {
    return verres / objectif;
  }
}
