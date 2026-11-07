#!/usr/bin/env bash
# Déploie l'admin-web sur le VPS, depuis ta machine :
#
#   ./admin-web/deploy/deploy.sh deploy@ip-du-vps
#
# 1. vérifie et compile localement (npm ci, tests, build) ;
# 2. envoie dist/ dans releases/<horodatage> ;
# 3. bascule `current` (atomique : nginx sert l'ancienne ou la nouvelle
#    version, jamais un mélange) et garde les 5 dernières releases.
# Retour arrière : relancer avec ROLLBACK=1 rebascule sur la release précédente.
set -euo pipefail

TARGET="${1:?Usage : deploy.sh utilisateur@ip-du-vps}"
BASE="/var/www/admin.lahiyarouwadayaro.com"
RELEASE="$(date +%Y%m%d-%H%M%S)"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${ROLLBACK:-}" == "1" ]]; then
  ssh "$TARGET" "set -euo pipefail
    cd '$BASE/releases'
    CURRENT=\$(basename \"\$(readlink -f '$BASE/current')\")
    PREVIOUS=\$(ls -1 | sort -r | grep -A1 -x \"\$CURRENT\" | tail -n +2 | head -n 1)
    [ -n \"\$PREVIOUS\" ] || { echo '✗ Pas de release précédente.'; exit 1; }
    ln -sfn '$BASE/releases/'\"\$PREVIOUS\" '$BASE/current.tmp' && mv -T '$BASE/current.tmp' '$BASE/current'
    echo \"✓ Retour à la release \$PREVIOUS\""
  exit 0
fi

echo "→ Build local"
(cd "$APP_DIR" && npm ci && npm test && npm run build)

echo "→ Envoi de la release $RELEASE vers $TARGET:$BASE"
tar -C "$APP_DIR/dist" -czf - . |
  ssh "$TARGET" "set -euo pipefail
    test -d '$BASE/releases' || { echo '✗ $BASE absent : lancer d abord admin-web/deploy/setup-vps.sh (voir README).'; exit 1; }
    mkdir -p '$BASE/releases/$RELEASE'
    tar -xzf - -C '$BASE/releases/$RELEASE'
    test -s '$BASE/releases/$RELEASE/index.html'
    ln -sfn '$BASE/releases/$RELEASE' '$BASE/current.tmp'
    mv -T '$BASE/current.tmp' '$BASE/current'
    cd '$BASE/releases' && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "✓ Admin en ligne : https://admin.lahiyarouwadayaro.com"
