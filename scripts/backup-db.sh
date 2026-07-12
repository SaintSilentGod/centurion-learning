#!/usr/bin/env bash
set -euo pipefail

# Daily PostgreSQL backup helper.
# Usage: DATABASE_URL=postgres://... ./scripts/backup-db.sh [output-dir]
#
# Store dumps in encrypted object storage and verify restore periodically.

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

OUT_FILE="$OUTPUT_DIR/centurion-learning-${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$OUT_FILE"

echo "Backup written to $OUT_FILE"
echo "Upload to object storage and encrypt at rest before deleting local copies."
