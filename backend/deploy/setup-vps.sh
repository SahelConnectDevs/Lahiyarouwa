#!/usr/bin/env bash
# Préparation UNIQUE du VPS pour l'API (Ubuntu 22.04/24.04, Debian 12 ou 13).
# À lancer une seule fois, sur le VPS, en root :
#
#   sudo bash setup-vps.sh deploy
#
# `deploy` est le nom de l'utilisateur (déjà existant, avec sa clé SSH) qui
# fera les déploiements. Le script installe Node.js 24 LTS, PM2, nginx et
# certbot, ouvre le pare-feu (SSH + HTTP/HTTPS uniquement) et crée
# l'arborescence /var/www/api.lahiyarouwadayaro.com/{releases,shared}.
# Il ne touche pas aux sites nginx déjà présents (ex: le site vitrine).
set -euo pipefail

DEPLOY_USER="${1:?Usage : sudo bash setup-vps.sh <utilisateur-de-deploiement>}"
BASE="/var/www/api.lahiyarouwadayaro.com"

id "$DEPLOY_USER" >/dev/null 2>&1 || { echo "L'utilisateur $DEPLOY_USER n'existe pas."; exit 1; }

echo "→ Paquets système"
apt-get update
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw

if ! command -v node >/dev/null || [[ "$(node -v)" != v24.* ]]; then
  echo "→ Node.js 24 LTS (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

echo "→ PM2"
npm install -g pm2@6
# Démarre PM2 (et donc l'API) au boot, sous l'utilisateur de déploiement.
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$DEPLOY_USER" --hp "$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"

echo "→ Pare-feu : SSH, HTTP, HTTPS (le port 3000 de l'API reste fermé)"
# Par numéro de port plutôt que par profil applicatif ('OpenSSH', 'Nginx Full') :
# les noms de profils varient selon les distributions, et une erreur ici
# pourrait couper l'accès SSH.
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')"
ufw allow "${SSH_PORT:-22}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "→ Dossiers de l'API"
mkdir -p "$BASE/releases" "$BASE/shared"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BASE"

if [[ ! -f "$BASE/shared/.env" ]]; then
  install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /dev/null "$BASE/shared/.env"
  echo "  $BASE/shared/.env créé (vide) : à remplir avant le premier déploiement (voir README)."
fi

echo "✓ VPS prêt. Étapes suivantes : nginx + certbot, .env, puis deploy.sh (voir backend/README.md)."
