#!/usr/bin/env bash
# Préparation UNIQUE du VPS pour l'admin-web, à lancer en root sur le VPS
# (après backend/deploy/setup-vps.sh, qui a installé nginx et certbot) :
#
#   bash setup-vps.sh deploy
#
# Crée /var/www/admin.lahiyarouwadayaro.com (propriété de l'utilisateur de
# déploiement), installe le site nginx et obtient le certificat HTTPS.
set -euo pipefail

DEPLOY_USER="${1:?Usage : bash setup-vps.sh <utilisateur-de-deploiement>}"
DOMAIN="admin.lahiyarouwadayaro.com"
BASE="/var/www/$DOMAIN"
HERE="$(cd "$(dirname "$0")" && pwd)"

id "$DEPLOY_USER" >/dev/null 2>&1 || { echo "L'utilisateur $DEPLOY_USER n'existe pas."; exit 1; }

echo "→ Dossiers de l'admin"
mkdir -p "$BASE/releases"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BASE"

echo "→ Site nginx"
install -m 644 "$HERE/nginx-admin.conf" "/etc/nginx/sites-available/$DOMAIN"
ln -sfn "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
systemctl reload nginx

echo "→ Certificat HTTPS"
if [[ ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos --register-unsafely-without-email
else
  echo "  Certificat déjà présent."
fi

echo "✓ VPS prêt pour l'admin. Déploiement depuis ta machine : ./admin-web/deploy/deploy.sh $DEPLOY_USER@<ip-du-vps>"
