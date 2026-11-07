#!/usr/bin/env bash
# Déploie l'API sur le VPS, depuis ta machine :
#
#   ./backend/deploy/deploy.sh deploy@ip-du-vps
#
# 1. compile localement (npm ci + build) pour ne jamais envoyer du code qui
#    ne compile pas ;
# 2. envoie dist/ + package*.json + ecosystem.config.cjs dans
#    releases/<horodatage> ;
# 3. sur le VPS : installe les dépendances de prod, relie shared/.env,
#    lance le seed (idempotent), bascule `current` et recharge PM2 sans
#    coupure ;
# 4. vérifie /health, et revient à la release précédente si l'API ne répond pas.
# Les 5 dernières releases sont conservées.
set -euo pipefail

TARGET="${1:?Usage : deploy.sh utilisateur@ip-du-vps}"
BASE="/var/www/api.lahiyarouwadayaro.com"
RELEASE="$(date +%Y%m%d-%H%M%S)"
API_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Build local"
(cd "$API_DIR" && npm ci && npm run build)

echo "→ Envoi de la release $RELEASE vers $TARGET:$BASE"
tar -C "$API_DIR" -czf - dist package.json package-lock.json ecosystem.config.cjs |
  ssh "$TARGET" "set -euo pipefail
    test -s '$BASE/shared/.env' || { echo '✗ $BASE/shared/.env manquant ou vide (voir README).'; exit 1; }
    mkdir -p '$BASE/releases/$RELEASE'
    tar -xzf - -C '$BASE/releases/$RELEASE'
    cd '$BASE/releases/$RELEASE'
    npm ci --omit=dev --no-audit --no-fund
    ln -sfn '$BASE/shared/.env' .env
    npm run seed
    PREVIOUS=\$(readlink -f '$BASE/current' 2>/dev/null || true)
    ln -sfn '$BASE/releases/$RELEASE' '$BASE/current.tmp'
    mv -T '$BASE/current.tmp' '$BASE/current'
    cd '$BASE/current'
    pm2 startOrReload ecosystem.config.cjs --update-env
    pm2 save
    for i in 1 2 3 4 5 6 7 8 9 10; do
      if curl -fsS http://127.0.0.1:3000/health >/dev/null; then OK=1; break; fi
      sleep 2
    done
    if [ -z \"\${OK:-}\" ]; then
      echo '✗ /health ne répond pas : retour à la release précédente.'
      if [ -n \"\$PREVIOUS\" ]; then
        ln -sfn \"\$PREVIOUS\" '$BASE/current.tmp' && mv -T '$BASE/current.tmp' '$BASE/current'
        cd '$BASE/current' && pm2 startOrReload ecosystem.config.cjs --update-env
      fi
      pm2 logs lahiyarouwa-api --lines 30 --nostream
      exit 1
    fi
    cd '$BASE/releases' && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "✓ API en ligne : https://api.lahiyarouwadayaro.com/health"
