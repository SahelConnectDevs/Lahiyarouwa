# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout (monorepo)

This repo (`SahelConnectDevs/Lahiyarouwa`) is the root of a **monorepo** meant to eventually hold three stacks side by side:

- **This Flutter mobile app** — lives directly at the repo root (`lib/`, `android/`, `ios/`, `pubspec.yaml`, ...), not in its own subfolder, since it was the first thing built here.
- **`backend/`** — Node.js + Express + MongoDB REST API, TypeScript. See [Backend architecture](#backend-architecture).
- **`admin-web/`** — the web admin back office: React 19 + TypeScript + Vite + React Router, served as static files by nginx at `admin.lahiyarouwadayaro.com`. See [Admin web](#admin-web).
- **`website/`** — public marketing one-page site + the privacy policy (`/confidentialite`) and account-deletion page (`/suppression-compte`) whose URLs are registered in the Google Play Console. Plain static HTML/CSS/JS, no build step and deliberately **no third-party resources** (fonts, CDNs, analytics) so it stays consistent with the privacy policy and the strict CSP in `website/deploy/security-headers.conf`. Served by nginx on a separate VPS at `lahiyarouwadayaro.com`; setup and `deploy/deploy.sh` usage are in [website/README.md](website/README.md). If the app starts collecting new data or adds a permission/SDK, update `confidentialite.html` (and its "Dernière mise à jour" date) in the same PR.

Each stack keeps its own `package.json`/lockfile (or `pubspec.yaml`) and its own section in this file; don't merge one stack's conventions into another's.

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

## Commands — Backend (Node/Express, MongoDB)

Run from `backend/` (TypeScript, Node `>=20`, npm).

- `npm install` — install dependencies
- `npm run dev` — run the API with hot-reload (`tsx watch`), reads `backend/.env` (copy from [.env.example](backend/.env.example) first)
- `npm run dev:memory` — local demo API with **no MongoDB to install** (`dev/memory-server.ts`): in-memory database, seeded content and fake accounts (`admin@demo.local`, `agent@demo.local`, password `demo-password`), codes/reset links printed to the console; always overrides `.env` so it can never touch production. Pair with `npm run dev` in `admin-web/`.
- `npm run build` — type-check and compile `src/` to `dist/` (also the type-check gate for CI). Uses [tsconfig.build.json](backend/tsconfig.build.json) (extends the base [tsconfig.json](backend/tsconfig.json) with `rootDir`/`outDir` and `src`-only `include`) so `dist/` mirrors `src/` flatly; the base `tsconfig.json` (which also includes `tests/`, for `ts-jest`) would otherwise make `tsc` emit a nested, wrong `dist/src/` layout — keep using `tsconfig.build.json` for any build/type-check command, not the base file.
- `npm start` — run the compiled `dist/server.js` (production)
- `npm run lint` — ESLint (flat config, [eslint.config.mjs](backend/eslint.config.mjs))
- `npm run format` / `npm run format:check` — Prettier write / check
- `npm test` — full test suite (Jest + Supertest, MongoDB provided in-memory — no local Mongo or Docker needed)
- `npm test -- tests/auth.test.ts` — run a single test file
- `npm test -- -t "<test name>"` — run a single test by name
- `npm run seed:dev` / `npm run seed` — insert missing starter content (CPN steps, vaccine schedule, tips) from `src/` / `dist/`
- `npm run create-admin:dev -- --email <email> --name "<nom>"` (or `create-admin` on the VPS) — create or promote an admin account; the password is prompted, never passed as an argument

## Backend architecture

Layered, one folder per concern under `backend/src/`, matching the mobile app's layering philosophy (thin controllers, no domain layer):

`routes/` (HTTP verbs + path, wires validators/middlewares/controller) → `controllers/` (extracts `req`, calls a service, sets the HTTP response — no business logic) → `services/` (business logic, talks to Mongoose models, throws `AppError`) → `models/` (Mongoose schemas).

- `src/app.ts` builds the Express app (`helmet`, `cors`, `express.json()`, mounts `routes/` under `/api`, then `notFound` + `errorHandler`) without starting a server — this is what tests import via `createApp()`. `src/server.ts` is the only place that connects to MongoDB and calls `.listen()`.
- **Error contract with the mobile client is load-bearing** — don't change it without updating `lib/core/network/api_client.dart` too: every thrown `AppError` (`src/utils/AppError.ts`) is turned by `error.middleware.ts` into `{ message, errors? }`, where `errors` (a `{ field: reason }` map) is only present for `AppError.validation` (HTTP 422). This is exactly what `ValidationException`/`ServerException`/`UnauthorizedException` on the Flutter side expect.
- `middlewares/validate.middleware.ts` turns `express-validator` results into that same `{ message, errors }` shape — always pair a `*.validator.ts` chain with `validate` in the route (see `routes/auth.routes.ts`).
- `middlewares/auth.middleware.ts` — `requireAuth()` verifies the JWT and attaches `req.user` (typed via `src/types/express.d.ts`); `requireRole('admin', ...)` (used after `requireAuth()`) restricts a route by role. Roles are `user` / `relais` / `admin` on the `User` model — `admin` is what `admin-web` authenticates with (by email) against this same API; the mobile app never shows admin UI.
- **Admins and community agents log in with 2FA by email** (`services/twoFactor.service.ts`, `requiresTwoFactor` = `admin`, or `relais` with an email — legacy agents without one still log in by phone with no code). An email is required to create an agent, to promote a user to `relais`/`admin`, and can't be removed from those accounts (`PATCH /admin/users/:id` accepts `email`). For them, `POST /auth/login` returns `{ mfaRequired, challengeToken, email, ... }` instead of `{ token, user }`, and mails a 6-digit code via `services/mail.service.ts` (nodemailer over Brevo's SMTP relay `smtp-relay.brevo.com:587`, sender `smtpsahelconnect@gmail.com`, `SMTP_*` env). `POST /auth/login/verify` exchanges it for `{ token, user }`; `/auth/login/resend` sends a new one. `LoginChallenge` stores only HMAC digests, expires after 10 min (TTL index) and allows 5 wrong codes. Without SMTP the code goes to the console in dev, `testOutbox` in tests (`lastLoginCode()`/`loginAdmin()` in `tests/helpers.ts`), and a 503 in prod. `user` (beneficiary) logins are unchanged.
- **Forgot password** (`services/passwordReset.service.ts`): `POST /auth/password/forgot { email }` always answers 200 with the same message (no account enumeration) and mails a single-use link `${WEB_APP_URL}/reinitialiser-mot-de-passe#<token>` (token in the URL fragment so it never reaches server logs or `Referer`), valid 30 min, at most one per account every 2 min. `POST /auth/password/reset { token, newPassword }` sets it, bumps `tokenVersion` and clears pending codes; it does not log in (2FA still applies). `PasswordReset` stores only HMAC digests (TTL index). Mail templates share `templates/layout.ts` (`renderMail`, `logoAttachment`).
- **Accounts created or reset by an admin** (`POST /admin/users`, `POST /admin/users/:id/reset-password` in `admin.service.ts`) get an 8-digit temporary password from `utils/password.ts`, returned once, and `User.mustChangePassword = true`. `changePassword` clears it. `PublicUser.mustChangePassword` tells clients to force the change: admin-web does (`ForcedPasswordChange`), the mobile app doesn't yet. Admins can't create `admin` accounts this way (use `create-admin`) or set `partageRelais` (only the beneficiary consents), and promoting a user to admin requires an email (2FA).
- `middlewares/rateLimit.middleware.ts` — `loginRateLimit` (10 req/15 min/IP) is applied to `POST /auth/login` only; apply the same pattern to any other unauthenticated, guessable-credential endpoint.
- **`features/auth` (`routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `models/User.ts`) is the reference implementation** — passwords hashed with `bcryptjs` (never stored/returned — `passwordHash` is `select: false` on the schema), JWT signed with `jwt.ts`. Accounts are identified by **phone** (normalized to `+227XXXXXXXX` by `utils/phone.ts`); email is optional and is what admins log in with. The JWT carries `v` = `User.tokenVersion`, bumped on password change / deactivation so `requireAuth()` rejects every older token.
- Implemented domains, one router each in `routes/index.ts`: `auth`, `grossesse` (+ CPN), `enfants`, `vaccins`/`vaccinations`, `contractions`, `alertes`, `conseils` (public), `planification` (family planning: public method catalog + the user's current method with computed reminders), `rappels` (unified PF/CPN/vaccine reminders), `relais` (community-agent space, `requireRole('relais')`) and `admin` (back-office API for `admin-web`, `requireRole('admin')` on the whole router). Still to build the same way: `nutrition`, `assistant_ia`, voice messages and the IVR (SVI).
- **Community agents (`relais`) see only beneficiaries whose `User.relais` points to them, and see their health follow-up (pregnancy, PF method, reminders) only when `User.partageRelais` is true** — enforced in `services/relais.service.ts`; keep any new agent-facing data behind the same two checks. Alerts are routed to the agent at creation (`Alert.relais`); reassigning a beneficiary moves her open alerts.
- **Controllers read input only through `bodyData(req)` / `queryData(req)`** (`utils/request.ts`, wraps express-validator's `matchedData`), never `req.body` directly — only fields declared in the route's validators reach a service, which is what blocks mass-assignment (e.g. `role: 'admin'` at register). User-owned services always filter by the current user id and answer 404 (not 403) for someone else's resource.
- **Any new collection holding user data must be added to `services/userData.service.ts`'s `deleteUserAndData`** — it backs both in-app account deletion (`DELETE /auth/me`) and admin deletion, which is the promise made by `website/confidentialite.html` and `website/suppression-compte.html`.
- Admin-editable content (`Conseil`, `Vaccine`, `CpnStep`) goes through the generic `services/content.service.ts` + `admin.controller.contentHandlers`; starter content lives in `scripts/seedData.ts` and `npm run seed` only inserts what's missing (never overwrites admin edits).
- **Backups**: Atlas M0 has none, so `src/scripts/backup.ts` (`npm run backup`, run nightly at 02:30 by the PM2 app `lahiyarouwa-backup` in `ecosystem.config.cjs` (`cron_restart`, `autorestart: false` — no system cron/root needed, and every `deploy.sh` reloads it so it also backs up right after each deploy), 14 kept in `shared/backups/`) dumps every collection as gzipped EJSON with no external tool; `src/scripts/restore.ts` (`npm run restore -- <file> [--confirm]`) inspects or restores it. New collections are covered automatically — nothing to register. Backups stay on the VPS (no off-site copy yet).
- Deployment (VPS: nginx → PM2 → Node, MongoDB Atlas) is documented in [backend/README.md](backend/README.md); `backend/deploy/deploy.sh` builds locally, ships a release, runs the seed, reloads PM2 and rolls back if `/health` fails.
- Tests (`backend/tests/`) call `useTestDatabase()` from [tests/helpers.ts](backend/tests/helpers.ts) (spins up `mongodb-memory-server`, clears every collection between tests) and hit `createApp()` with Supertest via the shared `app`, `registerUser()` and `loginAdmin()` helpers — no real network, no external MongoDB, identical locally and in CI. See [tests/auth.test.ts](backend/tests/auth.test.ts) as the pattern for new feature tests.

## Admin web

Run from `admin-web/` (React 19, TypeScript, Vite, React Router 7; Node `>=22`, npm). Details and deployment in [admin-web/README.md](admin-web/README.md).

- `npm run dev` — http://localhost:5173, with `/api` proxied to the local API on :3000 (start `npm run dev` in `backend/` first); `API_PROXY_TARGET=<url>` to proxy elsewhere
- `npm test` (Vitest) · `npm run lint` (oxlint) · `npm run build` (`tsc -b` + Vite → `dist/`)
- Deploy: `./admin-web/deploy/deploy.sh deploy@<vps>` (builds + tests locally, atomic `current` symlink switch, `ROLLBACK=1` to go back). One-time root setup: `admin-web/deploy/setup-vps.sh`.

Conventions:
- **Same origin as the API**: nginx serves `dist/` and proxies `/api/` to `127.0.0.1:3000` (`deploy/nginx-admin.conf`), so the client calls relative `/api/...` — no CORS, strict CSP (`connect-src 'self'`, no third-party resources, no inline scripts). Keep it that way: no CDN fonts/scripts.
- **All HTTP goes through `src/api/client.ts`** (`api<T>()`), never `fetch` in a page. It attaches the JWT, maps `{ message, errors }` to `ApiError` (field errors on 422) and calls the `AuthProvider`'s logout on any 401 — the same contract as the Flutter `ApiClient`.
- `src/api/types.ts` is the only copy of the API's response shapes on this side; update it together with the backend service it mirrors.
- Accounts (agents, beneficiaries) are created from `UsersPage`/`AgentsPage` via `components/accounts.tsx` (`CreateUserModal`, `TemporaryPassword`); `UserDetailPage` resets a password. `/mon-compte` (`AccountPage`) changes the admin's own password and `updateSession()` stores the new token.
- `/mot-de-passe-oublie` and `/reinitialiser-mot-de-passe` (`pages/PasswordResetPages.tsx`) are served while signed out; the reset page reads the token from `location.hash` then strips it with `history.replaceState`.
- Login is two steps (`LoginPage`): password → `LoginChallenge`, then the emailed code → `verifyCode`. A login that returns a token directly is a non-admin and is refused.
- Two roles get past `AuthContext`: `admin` (back office, email + 2FA code) and `relais` (**agent space**, email + 2FA code). The login field takes either an email or a phone. `App.tsx` renders a separate route tree per role: agents get `pages/agent/*` (home with the week's reminders, beneficiaries, beneficiary detail with follow-up notes, alerts), backed only by `/api/relais/*`, and `Layout` switches nav (`AGENT_NAV`). The role check is UX; the real gates are `requireRole('admin')` / `requireRole('relais')` on the API. Token in `sessionStorage`, not `localStorage`.
- Pages load data with `useApi(load, key)` (abortable, `reload()`); filters/pagination live in the URL query string so views are linkable.
- Admin-editable content (`conseils`, `methodes-pf`, `vaccins`, `cpn-etapes`) uses the one generic `src/content/ContentPage.tsx`, driven by field declarations in `src/content/configs.tsx` that mirror the backend validators. A new content type = backend `mountContent(...)` + a config entry + a nav link, not a new page.
- Never display a beneficiary's health follow-up in the **admin** pages: that data is only for her `relais`, with her consent. The agent pages show it only through `/api/relais/*`, which already enforces assignment + `partageRelais` (see the backend rules above). Agent pages are used on phones: lists are `.item-list` cards with `tel:` call buttons, not tables.

## Mobile app architecture

Platform folders exist for Android, iOS, web, Windows, Linux, and macOS, so the app targets all of these.

`lib/` follows a **feature-first** layout:

- `lib/core/` — cross-cutting code shared across features: `constants/` (API config), `errors/` (typed `AppException`s), `network/` (`ApiClient`, `ApiEndpoints`), plus `extensions/` and `utils/` (currently unused)
- `lib/features/` — one folder per domain feature: `auth`, `grossesse` (pregnancy), `enfant` (child), `vaccination`, `nutrition`, `planning_familial` (family planning), `relais` (community relay/health worker), `alertes` (alerts), `assistant_ia` (AI assistant). Wired to the API so far: `auth` (phone + password login, sign-up), `grossesse` (DDR, pregnancy, CPN calendar), `vaccination` (mother's calendar, record a dose), `conseils` (published tips, filtered by pregnancy week), `alertes` (report a danger sign) and `contractions` (save a timer session); the others are still empty scaffolding. The screens themselves still live in the legacy `lib/view/` and `lib/widgets/` folders (built before the feature-first layout) and read their data only through these features' providers.

This is a maternal & child health tracking app for a French-speaking context, backed by a separate Node/Express REST API. **There is no admin UI in this app** — administration is a separate, non-Flutter back office; this codebase only ever needs to consume the API as a regular (or `relais`) user.

### Networking & auth (see `lib/features/auth` as the reference implementation)

- `lib/core/network/api_client.dart` — the single `Dio`-based `ApiClient`, instantiated once in `main.dart` and injected into every repository (repositories never talk to `Dio` directly, and the UI never talks to `ApiClient` directly). It attaches the stored JWT as `Authorization: Bearer <token>` on every request, and maps `DioException`s to typed `AppException`s (`NetworkException`, `ServerException`, `UnauthorizedException`, `ValidationException` — the last two match the backend's `{ message, errors: {field: reason} }` shape).
- `lib/core/network/endpoints.dart` — `ApiEndpoints`, grouped by feature (`ApiEndpoints.auth.login`, etc.); add a new nested `*Endpoints` class here per feature as it's built.
- `lib/core/constants/api_constants.dart` — base URL: the live API (`https://api.lahiyarouwadayaro.com/api`) by default in debug **and** release, so a debug build works on a real phone with no setup. Point it at a local backend with `--dart-define=API_BASE_URL=...` (e.g. `http://10.0.2.2:3000/api` for the Android emulator) — note a debug build then writes to the real production database unless you do.
- Each feature follows: `data/models/` (plain `fromJson`/`toJson` model classes) → `data/<feature>_repository.dart` (calls `ApiClient`, returns models, lets `AppException` propagate) → `providers/<feature>_provider.dart` (a `ChangeNotifier` holding loading/data/error state, the only thing screens under `screens/` talk to). There is no separate domain/use-case layer — keep repositories and providers thin and follow this same three-layer split for new features rather than introducing a different pattern.
- State management is **Provider**. `main.dart` wires `ApiClient` → each `*Repository` (`ProxyProvider`) → each `*Provider` (`ChangeNotifierProxyProvider`); wire new feature providers the same way rather than instantiating repositories inside widgets. Load state uses the shared `LoadStatus` enum (`core/utils/load_status.dart`); per-user providers expose `reset()`, which `_AppRoot` calls on logout so nothing leaks into the next session.
- `AuthProvider.status` (`unknown` / `unauthenticated` / `authenticated`) drives which screen `main.dart`'s `_AppRoot` shows: `WelcomePage` when signed out; when signed in, `DdrPage` until a pregnancy exists (unless "Plus tard"), then `HomePage`. On every auth status change `_AppRoot` pops the root navigator back to its first route — so screens push (never `pushReplacement`) and never navigate themselves after login/logout. `ApiClient.onUnauthorized` is wired to `AuthProvider.forceLogout` so a 401 from any endpoint logs the user out automatically (ignored when already signed out, e.g. a wrong password).
- Dates sent to the API go through `Dates.toApiDate` (`core/utils/dates.dart`): a past day is sent as a plain date, *today* as the current instant — the API rejects future dates, and `YYYY-MM-DD` (UTC midnight) would look like the future just after midnight in Niger (UTC+1).
- Error contract on the mobile side: a duplicate phone at sign-up is a **409** (`ServerException`, message shown in the banner), only 422 carries per-field errors (`ValidationException.fieldErrors`, shown under the matching field).
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
4. **Server is the source of truth** — the `validator:` checks in forms like `LoginScreen` are UX only; the backend re-validates everything server-side (`backend/src/validators/`) and rate-limits `/auth/login` (`backend/src/middlewares/rateLimit.middleware.ts`). Tokens are invalidated on password change/deactivation (`tokenVersion`); `CORS_ORIGIN` in prod is `https://admin.lahiyarouwadayaro.com` (never `*`), though `admin-web` itself is same-origin via nginx's `/api` proxy.
5. **Dependency audit** — run `flutter pub outdated` and address anything with a known CVE before tagging a release; rely on the committed `pubspec.lock` for reproducible builds rather than floating resolution at build time.
6. **Least-privilege native permissions** — before adding any Android/iOS permission (camera, location, notifications for `alertes`, etc.), confirm it ships with a usage-description string and is actually required by the feature that needs it.
7. **Certificate pinning** — not implemented yet; worth adding to `ApiClient` (Dio supports pinning via a custom `HttpClientAdapter`) given this is a health app likely used over shared/public wifi.

### Pre-release checklist

Run in order before tagging a release:
1. `dart format --set-exit-if-changed .`
2. `flutter analyze` — must report 0 issues
3. `flutter test --coverage`
4. Confirm the release build resolves to the `https://` prod `ApiConstants.baseUrl` (no `--dart-define=API_BASE_URL` override) and that `android/app/src/main/AndroidManifest.xml` still declares the `INTERNET` permission
5. Build with `--obfuscate --split-debug-info=<dir>` and archive the debug info privately (never commit it)
6. Walk the security checklist above for anything not yet marked done

## Continuous Integration

CI runs on GitHub Actions, one workflow per stack under [.github/workflows/](.github/workflows/), each scoped by `paths:` so a change in one stack never triggers another's pipeline:

- [mobile-ci.yml](.github/workflows/mobile-ci.yml) — **active now.** Triggers on `lib/**`, `test/**`, the platform folders, and `pubspec.*`. Runs `flutter pub get` → `dart format --set-exit-if-changed .` → `flutter analyze` → `flutter test --coverage`, i.e. steps 1–3 of the [Pre-release checklist](#pre-release-checklist) above, on every push/PR to `main`.
- [backend-ci.yml](.github/workflows/backend-ci.yml) — **active now.** Triggers on `backend/**`. Runs `npm ci` → `npm run format:check` → `npm run lint` → `npm run build` (type-check) → `npm test`. No service container needed: tests use `mongodb-memory-server`, an ephemeral in-process MongoDB (see `backend/tests/`), identical locally and in CI.
- [admin-web-ci.yml](.github/workflows/admin-web-ci.yml) — **active now.** Triggers on `admin-web/**`. Runs `npm ci` → `npm run lint` (oxlint) → `npm test` (Vitest) → `npm run build` (`tsc -b` type-check + Vite build).

Rules that apply across all three:
- **Branch protection**: require the relevant workflow(s) to pass before merging to `main` (GitHub repo Settings → Branches → protect `main` → required status checks). A PR that only touches `backend/**` shouldn't need the mobile job to pass, and vice versa — the `paths:` filters already make each workflow only *run* when relevant; still mark each as required so a stack can't merge with red CI.
- **Secrets**: `MONGODB_URI` (for anything beyond the ephemeral CI service container, i.e. staging/prod), the JWT signing secret, and any third-party API key go in GitHub Actions secrets (repo Settings → Secrets and variables → Actions) or the hosting platform's env config — never in a committed `.env`. Commit a `.env.example` per stack (`backend/.env.example`, `admin-web/.env.example`) listing the required variable names with placeholder values instead.
- **Node version**: workflows and the VPS (`backend/deploy/setup-vps.sh`) pin Node 24 LTS for `backend/` and `admin-web/`; bump both together if the project moves to a newer LTS, don't let the two stacks drift onto different major versions without a reason.
- **Scope**: these three workflows only validate (format/lint/analyze/test/build) — they don't deploy anything yet. Wiring `backend/` and `admin-web/` to an actual hosting target (and mobile builds to app stores) is a separate CD step to design once each stack has a chosen host; don't bolt deployment credentials onto these CI workflows without that discussion first.
