#!/usr/bin/env bash
# Installe la sauvegarde nocturne de la base (cron de l'utilisateur de
# déploiement, aucun droit root nécessaire). À lancer sur le VPS, en tant
# que deploy, après un premier déploiement de l'API :
#
#   bash install-backup-cron.sh
#
# Chaque nuit à 02:30 (heure du serveur), `npm run backup` écrit une
# sauvegarde compressée dans shared/backups/ (dossier en 700, fichiers en
# 600) et ne garde que les 14 dernières. Journal : shared/backups/backup.log.
# Relancer le script est sans effet de bord (la ligne n'est jamais dupliquée).
set -euo pipefail

BASE="/var/www/api.lahiyarouwadayaro.com"
DIR="$BASE/shared/backups"
NODE="$(command -v node)"
MARKER="# lahiyarouwa-backup"
LINE="30 2 * * * cd $BASE/current && BACKUP_DIR=$DIR BACKUP_KEEP=14 $NODE dist/scripts/backup.js >> $DIR/backup.log 2>&1 $MARKER"

test -f "$BASE/current/dist/scripts/backup.js" || {
  echo "✗ $BASE/current/dist/scripts/backup.js absent : déployer l'API d'abord (deploy.sh)."
  exit 1
}

mkdir -p "$DIR"
chmod 700 "$DIR"

{ crontab -l 2>/dev/null | grep -v "$MARKER" || true; echo "$LINE"; } | crontab -
echo "✓ Sauvegarde nocturne installée :"
crontab -l | grep "$MARKER"

echo "→ Première sauvegarde immédiate pour vérifier :"
cd "$BASE/current"
BACKUP_DIR="$DIR" BACKUP_KEEP=14 "$NODE" dist/scripts/backup.js | tee -a "$DIR/backup.log"
ls -l "$DIR"
