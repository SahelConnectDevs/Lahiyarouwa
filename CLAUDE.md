# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout (monorepo)

This repo (`SahelConnectDevs/Lahiyarouwa`) is the root of a **monorepo** meant to eventually hold three stacks side by side:

- **This Flutter mobile app** — lives directly at the repo root (`lib/`, `android/`, `ios/`, `pubspec.yaml`, ...), not in its own subfolder, since it was the first thing built here.
- **`backend/`** — Node.js + Express + MongoDB REST API. Not created yet.
- **`admin-web/`** — the web admin back office. Not created yet; framework not chosen yet (React/Next.js/Vue are all reasonable — pick one and use it consistently rather than mixing).

When either of those is created, give it its own `package.json`/lockfile and its own section in this file (commands, structure) rather than merging its conventions into the Flutter-specific sections below. The [Continuous Integration](#continuous-integration) section already has a ready-to-activate GitHub Actions workflow for each of the three stacks.

## Commands — Mobile app (Flutter)

This is a Flutter/Dart project (SDK `^3.11.4`).

- `flutter pub get` — install dependencies (run after any `pubspec.yaml` change)
- `flutter run` — run the app on a connected device/emulator (`-d chrome`, `-d windows`, etc. to target a platform)
- `flutter analyze` — static analysis; rules come from `package:flutter_lints/flutter.yaml` via [analysis_options.yaml](analysis_options.yaml)
- `flutter test` — run the full test suite
- `flutter test test/widget_test.dart` — run a single test file
- `flutter test --plain-name "<test name>"` — run a single test by name
- `flutter build <apk|ios|web|windows|linux|macos>` — build a release artifact for a platform
- `flutter clean` — clear build artifacts (useful when build state gets stale)

## Mobile app architecture

Platform folders exist for Android, iOS, web, Windows, Linux, and macOS, so the app targets all of these.

`lib/` follows a **feature-first** layout:

- `lib/core/` — cross-cutting code shared across features: `constants/` (API config), `errors/` (typed `AppException`s), `network/` (`ApiClient`, `ApiEndpoints`), plus `extensions/` and `utils/` (currently unused)
- `lib/features/` — one folder per domain feature: `auth`, `grossesse` (pregnancy), `enfant` (child), `vaccination`, `nutrition`, `planning_familial` (family planning), `relais` (community relay/health worker), `alertes` (alerts), `assistant_ia` (AI assistant). Only `auth` is implemented so far; the rest are empty scaffolding.

This is a maternal & child health tracking app for a French-speaking context, backed by a separate Node/Express REST API. **There is no admin UI in this app** — administration is a separate, non-Flutter back office; this codebase only ever needs to consume the API as a regular (or `relais`) user.

### Networking & auth (see `lib/features/auth` as the reference implementation)

- `lib/core/network/api_client.dart` — the single `Dio`-based `ApiClient`, instantiated once in `main.dart` and injected into every repository (repositories never talk to `Dio` directly, and the UI never talks to `ApiClient` directly). It attaches the stored JWT as `Authorization: Bearer <token>` on every request, and maps `DioException`s to typed `AppException`s (`NetworkException`, `ServerException`, `UnauthorizedException`, `ValidationException` — the last two match the backend's `{ message, errors: {field: reason} }` shape).
- `lib/core/network/endpoints.dart` — `ApiEndpoints`, grouped by feature (`ApiEndpoints.auth.login`, etc.); add a new nested `*Endpoints` class here per feature as it's built.
- `lib/core/constants/api_constants.dart` — base URL, switched by `kDebugMode` (dev vs prod); the dev URL assumes a locally running Express server (adjust the host for Android emulator / physical device as noted in the file).
- Each feature follows: `data/models/` (plain `fromJson`/`toJson` model classes) → `data/<feature>_repository.dart` (calls `ApiClient`, returns models, lets `AppException` propagate) → `providers/<feature>_provider.dart` (a `ChangeNotifier` holding loading/data/error state, the only thing screens under `screens/` talk to). There is no separate domain/use-case layer — keep repositories and providers thin and follow this same three-layer split for new features rather than introducing a different pattern.
- State management is **Provider**. `main.dart` wires `ApiClient` → `AuthRepository` → `AuthProvider` via `Provider`/`ProxyProvider`/`ChangeNotifierProxyProvider`; wire new feature providers the same way rather than instantiating repositories inside widgets.
- `AuthProvider.status` (`unknown` / `unauthenticated` / `authenticated`) drives which screen `main.dart`'s `_AppRoot` shows; `ApiClient.onUnauthorized` is wired to `AuthProvider.forceLogout` so a 401 from any endpoint logs the user out automatically.
- The JWT is persisted via `flutter_secure_storage`, not `SharedPreferences`.

## Code conventions & quality gates

- `dart format .` and a clean `flutter analyze` (0 issues) are required before any commit/PR — the project runs on `flutter_lints` defaults (see [analysis_options.yaml](analysis_options.yaml)); don't add `// ignore:` for a lint without a one-line comment explaining why.
- Respect the layering strictly: a screen/widget never imports `Dio`/`ApiClient`/a `*Repository` directly (only through its `*Provider`), and a repository never imports Flutter or `provider` (it only knows `ApiClient` and its own models).
- New feature = new folder under `lib/features/<name>/` mirroring `auth`'s `data/models/`, `data/<feature>_repository.dart`, `providers/<feature>_provider.dart`, `screens/`. Shared logic goes in the matching `lib/core/` subfolder, never copy-pasted per feature.
- Public classes/methods that aren't self-explanatory get a `///` doc comment, matching the level of detail already in `AuthRepository` and `AppException`.
- Standard Dart naming already used throughout: files `snake_case.dart`, types `UpperCamelCase`, private members `_leadingUnderscore`.

## Tests

- Every `*Repository` and `*Provider` gets unit tests under `test/features/<feature>/`, mirroring the `lib/` path. See [test/features/auth/auth_provider_test.dart](test/features/auth/auth_provider_test.dart) for the pattern: mock the repository with `mocktail` (never mock `ApiClient`/`Dio` directly when testing a provider — mock `ApiClient` only when testing a repository), and never touch the real network or the `flutter_secure_storage` platform channel from a test.
- Screens get a widget test asserting the key states render — not full coverage, just: initial render, loading, error (see [test/widget_test.dart](test/widget_test.dart) for `LoginScreen`).
- `flutter test --coverage` before a release; a coverage drop in `lib/core` or in a feature's `data/`/`providers/` layer is a regression to justify, not to ignore.
- Single-test commands: `flutter test test/features/auth/auth_provider_test.dart` (one file), `flutter test --plain-name "<test name>"` (one test by name).

## Security checklist before shipping to production

Already in place:
- JWT stored via `flutter_secure_storage` (Keychain/Keystore-backed) — never `SharedPreferences` or a Dart-level variable that could leak into logs.
- No secret/API key hardcoded in `lib/` — `ApiConstants.baseUrl` is the only environment-specific value and it's a public URL, not a credential.
- `ApiClient` centralizes token attachment and reacts to any `401` by forcing logout (`AuthProvider.forceLogout`), so a revoked/expired token can't keep working silently.

Still to do before a production release, in priority order:
1. **HTTPS only in prod** — confirm `ApiConstants._prodBaseUrl` is `https://` before building a release; never ship a build pointing at `http://`.
2. **No sensitive logging** — if a `LogInterceptor` is ever added to `ApiClient` for local debugging, gate it behind `kDebugMode` so request/response bodies (tokens, emails, health data) never ship in a release build; never `print`/`debugPrint` a token or full API response outside of that guard.
3. **Release build hardening** — build with `flutter build <target> --obfuscate --split-debug-info=<dir>` and keep the generated debug symbols out of version control; keep Android's default R8/ProGuard shrinking enabled in `android/app/build.gradle.kts`'s release config rather than disabling it.
4. **Server is the source of truth** — the `validator:` checks in forms like `LoginScreen` are UX only; coordinate with the Node/Express backend on rate-limiting `/auth/login`, invalidating tokens on password change, and (for Flutter web) CORS scoped to known origins.
5. **Dependency audit** — run `flutter pub outdated` and address anything with a known CVE before tagging a release; rely on the committed `pubspec.lock` for reproducible builds rather than floating resolution at build time.
6. **Least-privilege native permissions** — before adding any Android/iOS permission (camera, location, notifications for `alertes`, etc.), confirm it ships with a usage-description string and is actually required by the feature that needs it.
7. **Certificate pinning** — not implemented yet; worth adding to `ApiClient` (Dio supports pinning via a custom `HttpClientAdapter`) given this is a health app likely used over shared/public wifi.

### Pre-release checklist

Run in order before tagging a release:
1. `dart format --set-exit-if-changed .`
2. `flutter analyze` — must report 0 issues
3. `flutter test --coverage`
4. Confirm the release build resolves to the `https://` prod `ApiConstants.baseUrl`
5. Build with `--obfuscate --split-debug-info=<dir>` and archive the debug info privately (never commit it)
6. Walk the security checklist above for anything not yet marked done

## Continuous Integration

CI runs on GitHub Actions, one workflow per stack under [.github/workflows/](.github/workflows/), each scoped by `paths:` so a change in one stack never triggers another's pipeline:

- [mobile-ci.yml](.github/workflows/mobile-ci.yml) — **active now.** Triggers on `lib/**`, `test/**`, the platform folders, and `pubspec.*`. Runs `flutter pub get` → `dart format --set-exit-if-changed .` → `flutter analyze` → `flutter test --coverage`, i.e. steps 1–3 of the [Pre-release checklist](#pre-release-checklist) above, on every push/PR to `main`.
- [backend-ci.yml](.github/workflows/backend-ci.yml) — **template, dormant until `backend/` exists** (path-scoped to `backend/**`, so it simply never runs before that). Spins up a `mongo:7` service container, then `npm ci` → lint → `npm test` with `MONGODB_URI` pointed at that container. Adjust the lint/test script names once `backend/package.json` exists.
- [admin-web-ci.yml](.github/workflows/admin-web-ci.yml) — **template, dormant until `admin-web/` exists** (path-scoped to `admin-web/**`). Generic Node pipeline (`npm ci` → lint → build) that works unchanged for React, Next.js, or Vue — adjust once the framework is picked.

Rules that apply across all three:
- **Branch protection**: require the relevant workflow(s) to pass before merging to `main` (GitHub repo Settings → Branches → protect `main` → required status checks). A PR that only touches `backend/**` shouldn't need the mobile job to pass, and vice versa — the `paths:` filters already make each workflow only *run* when relevant; still mark each as required so a stack can't merge with red CI.
- **Secrets**: `MONGODB_URI` (for anything beyond the ephemeral CI service container, i.e. staging/prod), the JWT signing secret, and any third-party API key go in GitHub Actions secrets (repo Settings → Secrets and variables → Actions) or the hosting platform's env config — never in a committed `.env`. Commit a `.env.example` per stack (`backend/.env.example`, `admin-web/.env.example`) listing the required variable names with placeholder values instead.
- **Node version**: workflows currently pin Node 20 LTS for `backend/` and `admin-web/`; bump both together if the project moves to a newer LTS, don't let the two stacks drift onto different major versions without a reason.
- **Scope**: these three workflows only validate (format/lint/analyze/test/build) — they don't deploy anything yet. Wiring `backend/` and `admin-web/` to an actual hosting target (and mobile builds to app stores) is a separate CD step to design once each stack has a chosen host; don't bolt deployment credentials onto these CI workflows without that discussion first.
