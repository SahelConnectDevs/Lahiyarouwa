import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/providers/auth_provider.dart';
//import 'features/auth/screens/login_screen.dart';
import 'onboarding/welcome_page.dart';

void main() {
  runApp(const LahiyarouwaApp());
}

class LahiyarouwaApp extends StatelessWidget {
  const LahiyarouwaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ApiClient : instance unique, injectée dans chaque repository.
        Provider<ApiClient>(create: (_) => ApiClient()),
        ProxyProvider<ApiClient, AuthRepository>(
          update: (_, apiClient, _) => AuthRepository(apiClient),
        ),
        // Ajoute ici les repositories/providers des autres features au
        // fur et à mesure, sur le même modèle que AuthRepository/AuthProvider.
        ChangeNotifierProxyProvider<AuthRepository, AuthProvider>(
          create: (context) => AuthProvider(context.read<AuthRepository>()),
          update: (_, authRepository, previous) =>
              previous ?? AuthProvider(authRepository),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Lahiyarouwa',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        ),
        home: const WelcomePage(),
      ),
    );
  }
}

/*
/// Bascule entre l'écran de connexion et l'app une fois authentifié,
/// et restaure la session existante (token stocké) au démarrage.
class _AppRoot extends StatefulWidget {
  const _AppRoot();

  @override
  State<_AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<_AppRoot> {
  @override
  void initState() {
    super.initState();
    final authProvider = context.read<AuthProvider>();
    context.read<ApiClient>().onUnauthorized = authProvider.forceLogout;
    authProvider.restoreSession();
  }

  @override
  Widget build(BuildContext context) {
    final status = context.watch<AuthProvider>().status;

    return switch (status) {
      AuthStatus.unknown => const Scaffold(body: Center(child: CircularProgressIndicator())),
      AuthStatus.unauthenticated => const LoginScreen(),
      AuthStatus.authenticated => const _HomePlaceholder(),
    };
  }
}

/// Point d'accueil une fois connecté. Chaque feature (grossesse,
/// vaccination, nutrition, ...) branchera ici son propre écran, par
/// exemple via une bottom nav bar.
class _HomePlaceholder extends StatelessWidget {
  const _HomePlaceholder();

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Bonjour ${authProvider.currentUser?.name ?? ''}'),
        actions: [IconButton(onPressed: authProvider.logout, icon: const Icon(Icons.logout), tooltip: 'Déconnexion')],
      ),
      body: const Center(
        child: Text('Chaque feature (grossesse, vaccination, ...) branchera ici son propre écran.'),
      ),
    );
  }
}
*/
