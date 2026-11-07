import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/utils/load_status.dart';
import 'features/alertes/data/alerte_repository.dart';
import 'features/alertes/providers/alerte_provider.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/conseils/data/conseil_repository.dart';
import 'features/conseils/providers/conseil_provider.dart';
import 'features/contractions/data/contraction_repository.dart';
import 'features/contractions/providers/contraction_provider.dart';
import 'features/grossesse/data/grossesse_repository.dart';
import 'features/grossesse/providers/grossesse_provider.dart';
import 'features/vaccination/data/vaccination_repository.dart';
import 'features/vaccination/providers/vaccination_provider.dart';
import 'onboarding/welcome_page.dart';
import 'view/ddr_page.dart';
import 'view/home_page.dart';

void main() {
  runApp(const LahiyarouwaApp());
}

/// Navigator racine : vidé à chaque connexion/déconnexion pour que les
/// écrans empilés (connexion, inscription, paramètres...) ne restent pas
/// au-dessus de l'écran racine.
final _navigatorKey = GlobalKey<NavigatorState>();

class LahiyarouwaApp extends StatelessWidget {
  const LahiyarouwaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ApiClient : instance unique, injectée dans chaque repository.
        Provider<ApiClient>(create: (_) => ApiClient()),
        ProxyProvider<ApiClient, AuthRepository>(
          update: (_, api, _) => AuthRepository(api),
        ),
        ProxyProvider<ApiClient, GrossesseRepository>(
          update: (_, api, _) => GrossesseRepository(api),
        ),
        ProxyProvider<ApiClient, VaccinationRepository>(
          update: (_, api, _) => VaccinationRepository(api),
        ),
        ProxyProvider<ApiClient, ConseilRepository>(
          update: (_, api, _) => ConseilRepository(api),
        ),
        ProxyProvider<ApiClient, AlerteRepository>(
          update: (_, api, _) => AlerteRepository(api),
        ),
        ProxyProvider<ApiClient, ContractionRepository>(
          update: (_, api, _) => ContractionRepository(api),
        ),
        ChangeNotifierProxyProvider<AuthRepository, AuthProvider>(
          create: (context) => AuthProvider(context.read<AuthRepository>()),
          update: (_, repository, previous) =>
              previous ?? AuthProvider(repository),
        ),
        ChangeNotifierProxyProvider<GrossesseRepository, GrossesseProvider>(
          create: (context) =>
              GrossesseProvider(context.read<GrossesseRepository>()),
          update: (_, repository, previous) =>
              previous ?? GrossesseProvider(repository),
        ),
        ChangeNotifierProxyProvider<VaccinationRepository, VaccinationProvider>(
          create: (context) =>
              VaccinationProvider(context.read<VaccinationRepository>()),
          update: (_, repository, previous) =>
              previous ?? VaccinationProvider(repository),
        ),
        ChangeNotifierProxyProvider<ConseilRepository, ConseilProvider>(
          create: (context) =>
              ConseilProvider(context.read<ConseilRepository>()),
          update: (_, repository, previous) =>
              previous ?? ConseilProvider(repository),
        ),
        ChangeNotifierProxyProvider<AlerteRepository, AlerteProvider>(
          create: (context) => AlerteProvider(context.read<AlerteRepository>()),
          update: (_, repository, previous) =>
              previous ?? AlerteProvider(repository),
        ),
        ChangeNotifierProxyProvider<ContractionRepository, ContractionProvider>(
          create: (context) =>
              ContractionProvider(context.read<ContractionRepository>()),
          update: (_, repository, previous) =>
              previous ?? ContractionProvider(repository),
        ),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        debugShowCheckedModeBanner: false,
        title: 'Lahiyarouwa',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD81B60)),
        ),
        home: const _AppRoot(),
      ),
    );
  }
}

/// Restaure la session au démarrage et choisit l'écran racine :
/// accueil (onboarding) si déconnectée, sinon l'espace connecté.
class _AppRoot extends StatefulWidget {
  const _AppRoot();

  @override
  State<_AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<_AppRoot> {
  late final AuthProvider _auth;
  AuthStatus _lastStatus = AuthStatus.unknown;

  @override
  void initState() {
    super.initState();
    _auth = context.read<AuthProvider>();
    context.read<ApiClient>().onUnauthorized = _auth.forceLogout;
    _auth.addListener(_onAuthChanged);
    _auth.restoreSession();
  }

  @override
  void dispose() {
    _auth.removeListener(_onAuthChanged);
    super.dispose();
  }

  void _onAuthChanged() {
    final status = _auth.status;
    if (status == _lastStatus) return;
    final wasAuthenticated = _lastStatus == AuthStatus.authenticated;
    _lastStatus = status;

    _navigatorKey.currentState?.popUntil((route) => route.isFirst);
    if (status == AuthStatus.authenticated) {
      _loadUserData();
    } else if (wasAuthenticated) {
      // Rien de la session précédente ne doit rester en mémoire.
      context.read<GrossesseProvider>().reset();
      context.read<VaccinationProvider>().reset();
      context.read<ConseilProvider>().reset();
    }
  }

  Future<void> _loadUserData() async {
    final grossesse = context.read<GrossesseProvider>();
    final conseils = context.read<ConseilProvider>();
    context.read<VaccinationProvider>().load();
    await grossesse.load();
    await conseils.load(semaine: grossesse.pregnancy?.semaine);
  }

  @override
  Widget build(BuildContext context) {
    final status = context.watch<AuthProvider>().status;
    return switch (status) {
      AuthStatus.unknown => const _Splash(),
      AuthStatus.unauthenticated => const WelcomePage(),
      AuthStatus.authenticated => _SignedIn(onRetry: _loadUserData),
    };
  }
}

/// Espace connecté : demande la DDR tant qu'aucune grossesse n'est
/// déclarée (sauf si « Plus tard »), puis affiche l'app.
class _SignedIn extends StatelessWidget {
  const _SignedIn({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final grossesse = context.watch<GrossesseProvider>();
    return switch (grossesse.status) {
      LoadStatus.initial || LoadStatus.loading => const _Splash(),
      LoadStatus.error => _LoadError(
        message: grossesse.errorMessage,
        onRetry: onRetry,
      ),
      LoadStatus.loaded =>
        grossesse.hasPregnancy || grossesse.ddrSkipped
            ? const HomePage()
            : const DdrPage(),
    };
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: CircularProgressIndicator(color: Color(0xFFD81B60))),
  );
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.message, required this.onRetry});

  final String? message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.wifi_off_rounded,
              size: 56,
              color: Color(0xFFD81B60),
            ),
            const SizedBox(height: 16),
            Text(
              message ?? 'Impossible de charger vos données.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Réessayer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD81B60),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
