#!/bin/sh
# Sauvegarde quotidienne de la base (format compressé pg_dump), avec rotation.
# Restauration : pg_restore --clean --if-exists -d frenchtacos fichier.dump
set -eu

mkdir -p /sauvegardes
while true; do
  fichier="/sauvegardes/frenchtacos-$(date +%Y-%m-%d-%H%M).dump"
  if pg_dump --format=custom --file="$fichier.partiel"; then
    mv "$fichier.partiel" "$fichier"
    echo "[sauvegarde] $(date -Iseconds) OK : $fichier"
  else
    rm -f "$fichier.partiel"
    echo "[sauvegarde] $(date -Iseconds) ÉCHEC" >&2
  fi
  find /sauvegardes -name 'frenchtacos-*.dump' -mtime "+${RETENTION_JOURS:-30}" -delete
  sleep 86400
done
