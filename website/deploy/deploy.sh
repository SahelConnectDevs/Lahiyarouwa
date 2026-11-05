#!/usr/bin/env bash
# Déploie le site vitrine sur le VPS.
#
#   ./website/deploy/deploy.sh utilisateur@ip-du-vps
#
# Chaque déploiement est envoyé dans releases/<horodatage>, puis le lien
# `current` (servi par nginx) bascule dessus d'un coup : aucune coupure, et
# retour arrière possible en repointant `current` sur une release précédente.
# Les 5 dernières releases sont conservées.
set -euo pipefail

TARGET="${1:?Usage : deploy.sh utilisateur@ip-du-vps}"
BASE="/var/www/lahiyarouwadayaro.com"
RELEASE="$(date +%Y%m%d-%H%M%S)"
SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Envoi de la release $RELEASE vers $TARGET:$BASE"
tar -C "$SITE_DIR" --exclude=./deploy --exclude=./README.md -czf - . |
  ssh "$TARGET" "set -e
    mkdir -p '$BASE/releases/$RELEASE'
    tar -xzf - -C '$BASE/releases/$RELEASE'
    find '$BASE/releases/$RELEASE' -type d -exec chmod 755 {} +
    find '$BASE/releases/$RELEASE' -type f -exec chmod 644 {} +
    ln -sfn '$BASE/releases/$RELEASE' '$BASE/current.tmp'
    mv -T '$BASE/current.tmp' '$BASE/current'
    cd '$BASE/releases' && ls -1t | tail -n +6 | xargs -r rm -rf"

echo "✓ En ligne : https://lahiyarouwadayaro.com"
