# API Lahiyar Ouwa Da Yara

API REST Node.js 24 + Express 5 + MongoDB (TypeScript) utilisée par l'app mobile Flutter et par le futur back-office `admin-web/`.
En production elle tourne sur le VPS derrière nginx, à l'adresse `https://api.lahiyarouwadayaro.com/api`.

## Développement local

```bash
cd backend
cp .env.example .env      # puis renseigner MONGODB_URI et JWT_SECRET
npm install
npm run seed:dev          # contenus de départ : CPN, vaccins, conseils
npm run create-admin:dev -- --email toi@example.com --name "Ton nom"
npm run dev               # http://localhost:3000/api
```

| Commande                                     | Rôle                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm test`                                   | Tests (MongoDB en mémoire, rien à installer)                                    |
| `npm run lint` / `npm run format`            | ESLint / Prettier                                                               |
| `npm run build`                              | Compile `src/` vers `dist/`                                                     |
| `npm run seed`                               | Ajoute les contenus de départ manquants. Ne modifie jamais un contenu existant. |
| `npm run create-admin -- --email … --name …` | Crée ou promeut un compte admin. Le mot de passe est demandé au clavier.        |

## Points d'entrée

Tout est sous `/api`. Sauf mention contraire, les routes exigent `Authorization: Bearer <token>`.

En cas d'erreur, la réponse a toujours la forme `{ message, errors? }`. Le champ `errors` (`{ champ: raison }`) n'est présent que pour une erreur de validation (422).

### Compte : `/auth`

| Méthode | Chemin                  | Détail                                                                                                                                                                                                                                         |
| ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST    | `/auth/register`        | Public. Champs obligatoires : `name`, `phone`, `password`. Facultatifs : `email`, `birthDate`. Renvoie `{ token, user }`.                                                                                                                      |
| POST    | `/auth/login`           | Public. Avec `phone` + `password` (app) ou `email` + `password` (admin). Limité à 10 essais par 15 minutes. Renvoie `{ token, user }`, ou pour un admin `{ mfaRequired: true, challengeToken, email, expiresAt, resendIn }` (voir ci-dessous). |
| POST    | `/auth/login/verify`    | Public. Avec `challengeToken` + `code` (6 chiffres reçus par e-mail). Renvoie `{ token, user }`.                                                                                                                                               |
| POST    | `/auth/password/forgot` | Public. Avec `email`. Envoie un lien de réinitialisation (valable 30 min, un seul usage) si un compte actif correspond ; même réponse sinon. 5 demandes par heure et par IP.                                                                   |
| POST    | `/auth/password/reset`  | Public. Avec `token` (du lien) et `newPassword`. Déconnecte tous les appareils du compte.                                                                                                                                                      |
| POST    | `/auth/login/resend`    | Public. Avec `challengeToken`. Envoie un nouveau code (1 par minute, 5 au plus par connexion).                                                                                                                                                 |
| GET     | `/auth/me`              | Profil connecté.                                                                                                                                                                                                                               |
| PATCH   | `/auth/me`              | Modifie `name`, `email` ou `birthDate`.                                                                                                                                                                                                        |
| POST    | `/auth/me/password`     | Avec `currentPassword` + `newPassword`. Renvoie un nouveau token et déconnecte les autres appareils.                                                                                                                                           |
| DELETE  | `/auth/me`              | Avec `password`. Supprime le compte et toutes ses données (exigence Google Play).                                                                                                                                                              |

**Mot de passe provisoire** : un compte créé ou réinitialisé par un admin a `mustChangePassword: true` dans `user` jusqu'à ce qu'il change son mot de passe (`POST /auth/me/password`). Les clients doivent alors imposer l'écran de changement : c'est fait dans admin-web, pas encore dans l'app mobile.

**Double authentification des admins** : un mot de passe admin correct ne donne pas de token. Un code à 6 chiffres est envoyé à l'e-mail de connexion du compte (valable 10 minutes, usage unique). Au bout de 5 codes faux, il faut ressaisir le mot de passe. Les codes et les jetons ne sont stockés que hachés (collection `loginchallenges`, purgée automatiquement à expiration). Les agents communautaires (`relais`) ont la même double authentification dès que leur compte a un e-mail : il est obligatoire à leur création et pour passer un compte agent. Les bénéficiaires (`user`) ne sont pas concernées.

Le numéro de téléphone est normalisé : `90 12 34 56`, `+227 90123456` et `0022790123456` désignent tous le compte `+22790123456`.

### Suivi santé de l'utilisatrice connectée

| Méthode            | Chemin                                  | Détail                                                                                                                |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| GET                | `/grossesse`                            | Grossesse en cours : `semaine`, `jour`, `termePrevu`, `joursRestants`, `trimestre`. Renvoie `null` s'il n'y en a pas. |
| PUT                | `/grossesse`                            | Avec `ddr`. Crée la grossesse en cours (201) ou corrige sa DDR (200).                                                 |
| POST               | `/grossesse/terminer`                   | Avec `dateAccouchement`.                                                                                              |
| GET                | `/grossesse/cpn`                        | Les 8 CPN, chacune avec sa fenêtre de dates et son `statut` (`effectuee`, `en_cours`, `en_retard` ou `a_venir`).      |
| PUT                | `/grossesse/cpn/:numero`                | Avec `effectuee` (booléen), et en option `date` et `notes`.                                                           |
| GET, POST          | `/enfants`                              | Liste ou ajout d'un enfant (`prenom`, `dateNaissance`, `sexe`, `poidsNaissanceGrammes`).                              |
| GET, PATCH, DELETE | `/enfants/:id`                          | Un enfant. La suppression efface aussi ses vaccinations.                                                              |
| GET                | `/vaccins?cible=maman\|enfant`          | Calendrier vaccinal (contenu).                                                                                        |
| GET                | `/vaccinations/calendrier[?enfant=id]`  | Calendrier personnalisé avec, pour chaque vaccin, la date prévue et le statut (`fait`, `en_retard` ou `a_venir`).     |
| GET, POST          | `/vaccinations[?enfant=id]`             | Doses reçues, ou ajout d'une dose (`vaccin`, `enfant` en option, `date`, `lieu`, `notes`).                            |
| DELETE             | `/vaccinations/:id`                     | Supprime une dose.                                                                                                    |
| GET, POST          | `/contractions`                         | Séances du compteur de contractions : `debut`, `fin`, `contractions[]`.                                               |
| DELETE             | `/contractions/:id`                     | Supprime une séance.                                                                                                  |
| GET, POST          | `/alertes`                              | Signes inquiétants signalés : `signe` (une des valeurs de l'app), `details`.                                          |
| GET                | `/conseils?categorie=&langue=&semaine=` | **Public.** Conseils publiés.                                                                                         |

### Planification familiale et rappels

| Méthode | Chemin                                     | Détail                                                                                                                         |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| GET     | `/planification/methodes`                  | **Public.** Les 8 méthodes : avantages, effets secondaires, configuration du rappel.                                           |
| GET     | `/planification/methodes/:code`            | **Public.** Une méthode, ex. `injectable`.                                                                                     |
| GET     | `/planification/ma-methode`                | Méthode en cours avec `prochainRappel` (`echeance`, `joursRestants`, `enRetard`, `aPrevoir`, `heure`), ou `null`.              |
| POST    | `/planification/ma-methode`                | Avec `methode` (code), `dateDebut`, et en option `dureeJours`, `heureRappel` (HH:MM) et `notes`. Arrête la méthode précédente. |
| PATCH   | `/planification/ma-methode`                | Modifie `dureeJours`, `heureRappel` ou `notes` (`null` efface la valeur).                                                      |
| POST    | `/planification/ma-methode/renouvellement` | Avec `date` : injection faite, nouvelle plaquette, implant remplacé.                                                           |
| POST    | `/planification/ma-methode/arret`          | Avec `date`, et `raison` en option.                                                                                            |
| GET     | `/planification/historique`                | Toutes les méthodes suivies.                                                                                                   |
| GET     | `/rappels?horizon=30`                      | Rappels regroupés (PF, CPN, vaccins des enfants), du plus urgent au moins urgent.                                              |
| GET     | `/auth/me/agent`                           | Nom et téléphone de son agent communautaire, ou `null`.                                                                        |

Pour autoriser son agent à voir son suivi, l'utilisatrice envoie `PATCH /auth/me` avec `{ "partageRelais": true }`.

### Espace agent communautaire : `/relais` (rôle `relais` uniquement)

| Méthode   | Chemin                             | Détail                                                                                                           |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GET       | `/relais/tableau-de-bord`          | Nombre de bénéficiaires et de consentantes, alertes nouvelles ou en cours, rappels des 7 prochains jours.        |
| GET       | `/relais/beneficiaires?search=`    | Ses bénéficiaires, celles avec une alerte ouverte en premier.                                                    |
| GET       | `/relais/beneficiaires/:id`        | Fiche d'une bénéficiaire : résumé, alertes, accompagnements, rappels.                                            |
| GET, POST | `/relais/beneficiaires/:id/suivis` | Accompagnements : `type` (`appel`, `visite`, `orientation` ou `autre`), `date`, `note`, `orienteVers`, `alerte`. |
| GET       | `/relais/alertes?statut=`          | Alertes qui lui sont adressées.                                                                                  |
| PATCH     | `/relais/alertes/:id`              | Avec `statut` et `noteSuivi`.                                                                                    |

Règles d'accès :

- un agent ne voit que les bénéficiaires qui lui sont rattachées ;
- sans l'accord de la bénéficiaire (`partageRelais`), il ne voit que son nom, son téléphone, son secteur et ses alertes ;
- avec son accord, il voit aussi un résumé de son suivi : semaine de grossesse, méthode et rappels.

Une utilisatrice ne voit jamais les données d'une autre. Si elle demande une ressource qui ne lui appartient pas, l'API répond 404.

### Back-office : `/admin` (rôle `admin` uniquement)

| Méthode            | Chemin                                                   | Détail                                                                                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET                | `/admin/stats`                                           | Chiffres du tableau de bord.                                                                                                                                                                                                                                           |
| GET                | `/admin/users?search=&role=&isActive=&page=&limit=`      | Liste paginée `{ items, page, limit, total, totalPages }`.                                                                                                                                                                                                             |
| POST               | `/admin/users`                                           | Crée un compte agent (`role: 'relais'`) ou bénéficiaire (`role: 'user'`) avec `name`, `phone`, et en option `email`, `secteur`, `relais`. Renvoie `{ user, temporaryPassword }` (8 chiffres, affiché une seule fois). Le consentement `partageRelais` reste à `false`. |
| GET, PATCH, DELETE | `/admin/users/:id`                                       | Fiche d'un compte. Le PATCH accepte `role`, `isActive`, `relais`, `secteur` ; désactiver un compte le déconnecte immédiatement ; promouvoir admin exige un e-mail.                                                                                                     |
| POST               | `/admin/users/:id/reset-password`                        | Mot de passe oublié : renvoie `{ temporaryPassword }`, déconnecte tous les appareils du compte. Pas sur son propre compte.                                                                                                                                             |
| GET                | `/admin/alertes?statut=`                                 | Alertes, avec le nom et le téléphone de l'utilisatrice.                                                                                                                                                                                                                |
| PATCH              | `/admin/alertes/:id`                                     | Avec `statut` (`nouvelle`, `en_cours` ou `traitee`) et `noteSuivi`.                                                                                                                                                                                                    |
| CRUD               | `/admin/conseils`, `/admin/vaccins`, `/admin/cpn-etapes` | Contenus de l'app. Un conseil n'apparaît dans l'app qu'une fois `publie: true`.                                                                                                                                                                                        |

## Déploiement sur le VPS

L'architecture prévue :

- **nginx** gère le HTTPS (Let's Encrypt) et transmet les requêtes à l'API, qui n'écoute que sur `127.0.0.1:3000` ;
- **PM2** fait tourner l'API (2 processus) et la redémarre en cas de crash ou de reboot ;
- **MongoDB Atlas** héberge la base de données.

L'admin-web sera servi par le même nginx sur `admin.lahiyarouwadayaro.com`.

### 1. Une seule fois : préparer le terrain

1. **DNS.** Créer un enregistrement `A` `api.lahiyarouwadayaro.com` qui pointe vers l'IP du VPS. Faire de même pour `admin.` dès maintenant, pour plus tard.
2. **MongoDB Atlas :**
   - créer un cluster (l'offre M0 gratuite suffit pour démarrer) ;
   - créer un utilisateur de base de données avec un mot de passe fort ;
   - dans _Network Access_, autoriser **uniquement l'IP du VPS** ;
   - copier l'URI `mongodb+srv://…` et ajouter `/lahiyarouwa` comme nom de base.
3. **Installer le VPS** (Node 24 LTS, PM2, nginx, certbot, pare-feu). `deploy` est l'utilisateur SSH qui déploiera :
   ```bash
   scp backend/deploy/setup-vps.sh deploy@IP:/tmp/
   ssh deploy@IP 'sudo bash /tmp/setup-vps.sh deploy'
   ```
4. **Configurer nginx et le HTTPS :**
   ```bash
   scp backend/deploy/nginx-api.conf deploy@IP:/tmp/
   ssh deploy@IP
   sudo mv /tmp/nginx-api.conf /etc/nginx/sites-available/api.lahiyarouwadayaro.com
   sudo ln -s /etc/nginx/sites-available/api.lahiyarouwadayaro.com /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d api.lahiyarouwadayaro.com --redirect
   ```
5. **Renseigner les secrets** sur le VPS, dans `/var/www/api.lahiyarouwadayaro.com/shared/.env` (droits `600`, jamais commité) :
   ```ini
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://USER:MOT_DE_PASSE@cluster.xxxxx.mongodb.net/lahiyarouwa
   JWT_SECRET=<résultat de : node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://admin.lahiyarouwadayaro.com
   TRUST_PROXY=1
   ```

### 2. À chaque mise en ligne

Depuis ta machine (Git Bash sous Windows), à la racine du dépôt :

```bash
./backend/deploy/deploy.sh deploy@IP
```

Le script :

1. compile l'API en local ;
2. l'envoie dans une nouvelle release ;
3. installe les dépendances et ajoute les contenus de départ manquants ;
4. bascule sur la nouvelle version sans coupure ;
5. vérifie `/health`, et revient automatiquement à la version précédente si l'API ne répond pas.

### 3. Après le premier déploiement

```bash
ssh deploy@IP
cd /var/www/api.lahiyarouwadayaro.com/current
npm run create-admin -- --email admin@lahiyarouwadayaro.com --name "Ton nom"
```

### Exploitation

| Besoin                          | Commande (sur le VPS)                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| État de l'API                   | `pm2 status` · `curl https://api.lahiyarouwadayaro.com/health`                                                  |
| Journaux                        | `pm2 logs lahiyarouwa-api`                                                                                      |
| Redémarrer                      | `pm2 reload lahiyarouwa-api`                                                                                    |
| Revenir à la version précédente | `ln -sfn releases/<ancienne> current && pm2 reload lahiyarouwa-api` (dans `/var/www/api.lahiyarouwadayaro.com`) |

### Envoi des e-mails (codes de connexion admin)

Les codes partent via le relais SMTP de **Brevo** (compte créé avec smtpsahelconnect@gmail.com), expéditeur `smtpsahelconnect@gmail.com`. **À configurer avant de déployer** : sans SMTP, la connexion admin répond 503 en production.

1. Dans Brevo, **Expéditeurs, domaines et IP dédiées > Expéditeurs** : vérifier que `smtpsahelconnect@gmail.com` est un expéditeur validé (sinon l'ajouter et cliquer le lien de confirmation reçu).
2. Dans Brevo, **SMTP & API > onglet SMTP** : noter l'**identifiant** (`xxxx@smtp-brevo.com`) et générer une **clé SMTP** nommée « Lahiyarouwa API » (affichée une seule fois).
3. Sur le VPS, en tant que `deploy` : `nano /var/www/api.lahiyarouwadayaro.com/shared/.env`, puis ajouter :
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<identifiant SMTP Brevo, xxxx@smtp-brevo.com>
   SMTP_PASS=<clé SMTP Brevo>
   MAIL_FROM="Lahiyar Ouwa Da Yaro <smtpsahelconnect@gmail.com>"
   ```
4. `pm2 reload lahiyarouwa-api --update-env`, puis se connecter sur l'admin : le code doit arriver (regarder les spams la première fois).

En cas d'échec, le détail est dans `pm2 logs lahiyarouwa-api --lines 50 --nostream` (« Échec de l'envoi d'un e-mail ») et dans Brevo > **Transactionnel > Logs**. En local, sans `SMTP_HOST`, le code s'affiche dans la console de `npm run dev`. L'offre gratuite de Brevo permet 300 mails par jour, ce qui suffit largement pour les connexions admin.

Pour une meilleure délivrabilité, on pourra plus tard authentifier le domaine `lahiyarouwadayaro.com` dans Brevo (enregistrements DNS SPF/DKIM/DMARC) et envoyer depuis `no-reply@lahiyarouwadayaro.com` : il suffira de changer `MAIL_FROM`.

### Sauvegardes de la base

L'offre gratuite d'Atlas (M0) ne sauvegarde rien : le VPS fait donc lui-même une sauvegarde complète **chaque nuit à 02:30**, sans outil à installer (script Node `src/scripts/backup.ts`, documents en EJSON compressés).

- Planification : application PM2 `lahiyarouwa-backup` déclarée dans `ecosystem.config.cjs` (`cron_restart`), donc installée et mise à jour par chaque `deploy.sh` — rien à faire à la main, pas de cron système (absent du Debian minimal) ni de droit root. Chaque déploiement déclenche aussi une sauvegarde.
- Statut `stopped` dans `pm2 status` entre deux exécutions : normal. Journal : `pm2 logs lahiyarouwa-backup --lines 20 --nostream`.
- Fichiers : `/var/www/api.lahiyarouwadayaro.com/shared/backups/lahiyarouwa-AAAAMMJJ-HHMMSS.ejson.gz` (dossier `700`, fichiers `600`), **14 dernières** gardées.
- Sauvegarde manuelle : `cd /var/www/api.lahiyarouwadayaro.com/current && BACKUP_DIR=/var/www/api.lahiyarouwadayaro.com/shared/backups npm run backup`.
- Vérifier une sauvegarde sans rien modifier : `npm run restore -- <fichier>`.
- Restaurer (**remplace** le contenu des collections sauvegardées dans la base de `MONGODB_URI`) : `npm run restore -- <fichier> --confirm`. De préférence vers une base de test d'abord (`MONGODB_URI=... npm run restore -- ...`).

⚠️ Ces sauvegardes restent sur le VPS : elles protègent contre une erreur ou une suppression dans la base, pas contre la perte du serveur. Copier régulièrement le dossier ailleurs (ex. `scp deploy@IP:/var/www/api.lahiyarouwadayaro.com/shared/backups/*.gz .`) — ce sont des données de santé : les conserver chiffrées et hors de tout dossier partagé.

### Côté app mobile

L'app vise l'API en ligne (`https://api.lahiyarouwadayaro.com/api`) par défaut, en debug comme en release : voir `lib/core/constants/api_constants.dart` (surcharge possible avec `--dart-define=API_BASE_URL=...`).
