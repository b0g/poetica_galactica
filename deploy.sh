#!/usr/bin/env bash
# Déploie le site vers poetica.paradize.fr (YunoHost, app my_webapp__3).
# Usage : ./deploy.sh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SSH_PORT="${SSH_PORT:-2222}"
TARGET="${TARGET:-ia@paradize.fr}"
WEBROOT="${WEBROOT:-/var/www/my_webapp__3/www}"

echo "→ $SRC_DIR vers $TARGET:$WEBROOT"

rsync -avz --delete \
  -e "ssh -p ${SSH_PORT}" \
  --rsync-path="sudo rsync" \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude 'README.md' \
  --exclude 'deploy.sh' \
  --chown=my_webapp__3:www-data \
  --chmod=D755,F644 \
  "${SRC_DIR}/" "${TARGET}:${WEBROOT}/"

echo "→ https://poetica.paradize.fr/"
