# Lahiyar Ouwa — admin-web

Back-office web de l'application : React 19 + TypeScript + Vite, React Router.
Il consomme uniquement l'API d'administration du backend (`/api/admin/*`,
réservée au rôle `admin`) — aucune donnée n'est stockée côté admin-web.

En production : **https://admin.lahiyarouwadayaro.com** (nginx sur le même VPS que l'API).

## Ce que couvre l'admin

| Écran | API | Rôle |
| --- | --- | --- |
| Tableau de bord | `GET /admin/stats` | Comptes, suivi de santé, alertes, méthodes PF en cours, femmes sans agent |
| Alertes | `GET/PATCH /admin/alertes` | Signes inquiétants signalés : statut (nouvelle / en cours / traitée) et note de suivi |
| Utilisatrices et comptes | `GET/PATCH/DELETE /admin/users` | Recherche, filtres, rôle, activation, agent assigné, secteur, suppression complète |
| Agents communautaires | `GET /admin/relais` | Charge de chaque agent, affectation des femmes sans agent |
| Conseils santé, Méthodes PF, Calendrier vaccinal, Étapes CPN | `/admin/conseils`, `/admin/methodes-pf`, `/admin/vaccins`, `/admin/cpn-etapes` | Contenus affichés dans l'app (CRUD) |

Les détails du suivi de santé d'une femme ne sont **pas** affichés dans l'admin :
seul son agent communautaire y a accès, et seulement si elle a donné son accord
(`partageRelais`, voir `backend/src/services/relais.service.ts`).

Connexion par **e-mail + mot de passe** d'un compte `admin` (créé avec
`npm run create-admin` dans `backend/`). Le token est gardé en `sessionStorage` :
il disparaît à la fermeture de l'onglet.

## Commandes

```bash
npm install
npm run dev        # http://localhost:5173 — /api relayé vers http://localhost:3000 (API locale)
npm test           # Vitest (client API, conversion des formulaires)
npm run lint       # oxlint
npm run build      # vérification TypeScript + build de production dans dist/
```

`API_PROXY_TARGET=https://… npm run dev` relaie `/api` vers une autre API
(attention : c'est alors la vraie base de données).

## Structure

```
src/
  api/          client.ts (fetch + token + erreurs { message, errors }), types.ts (contrat avec l'API)
  auth/         AuthContext (connexion, réservée au rôle admin ; 401 => déconnexion)
  hooks/        useApi (chargement annulable, rechargement)
  components/   Layout (menu), ui.tsx (Modal, Pagination, Badge…)
  pages/        Tableau de bord, Alertes, Utilisatrices, Fiche, Agents, Connexion
  content/      Écran générique des contenus : configs.tsx décrit les champs de chaque contenu
```

Ajouter un contenu éditable : une route `mountContent(...)` dans
`backend/src/routes/admin.routes.ts`, puis une entrée dans
`src/content/configs.tsx` et un lien dans `src/components/Layout.tsx`.

## Déploiement (VPS)

L'admin est un site statique servi par nginx, qui relaie aussi `/api` vers
l'API Node du même serveur : même origine, donc ni CORS ni ressource tierce
(CSP stricte dans `deploy/nginx-admin.conf`).

1. **Une seule fois, en root sur le VPS** (DNS `admin.` → IP du VPS déjà en place) :
   copier `deploy/` sur le VPS puis `bash setup-vps.sh deploy`
   (dossier `/var/www/admin.lahiyarouwadayaro.com`, site nginx, certificat HTTPS).
2. **À chaque mise à jour, depuis ta machine** :
   `./admin-web/deploy/deploy.sh deploy@187.77.182.126`
   (npm ci + tests + build en local, envoi, bascule atomique, 5 releases gardées).
3. **Retour arrière** : `ROLLBACK=1 ./admin-web/deploy/deploy.sh deploy@187.77.182.126`.
