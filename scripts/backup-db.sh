#!/bin/bash
# ═══════════════════════════════════════════════
# PostgreSQL Automated Backup Script
# ═══════════════════════════════════════════════
# 
# Run daily via cron:
# 0 2 * * * /path/to/scripts/backup-db.sh
#
# Backs up to local directory + optionally uploads to Cloudflare R2.
# Keeps last 7 daily + 4 weekly backups.
#

set -euo pipefail

# Configuration (override via environment)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-msm}"
DB_NAME="${DB_NAME:-msm_prod}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-28}"
R2_BUCKET="${CLOUDFLARE_R2_BUCKET:-}"
R2_ENDPOINT="${CLOUDFLARE_R2_ENDPOINT:-}"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u")
BACKUP_FILE="${BACKUP_DIR}/msm_backup_${TIMESTAMP}.sql.gz"
WEEKLY_FILE="${BACKUP_DIR}/weekly/msm_weekly_${TIMESTAMP}.sql.gz"

# Create directories
mkdir -p "${BACKUP_DIR}" "${BACKUP_DIR}/weekly"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Perform backup with compression
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${FILE_SIZE})"

# Weekly backup (Sunday)
if [ "${DAY_OF_WEEK}" = "7" ]; then
  cp "${BACKUP_FILE}" "${WEEKLY_FILE}"
  echo "[$(date)] Weekly backup: ${WEEKLY_FILE}"
fi

# Upload to R2 if configured
if [ -n "${R2_BUCKET}" ] && [ -n "${R2_ENDPOINT}" ] && command -v aws &> /dev/null; then
  aws s3 cp "${BACKUP_FILE}" "s3://${R2_BUCKET}/backups/daily/$(basename ${BACKUP_FILE})" \
    --endpoint-url "${R2_ENDPOINT}" \
    --quiet
  echo "[$(date)] Uploaded to R2: ${R2_BUCKET}/backups/daily/"
  
  if [ "${DAY_OF_WEEK}" = "7" ]; then
    aws s3 cp "${WEEKLY_FILE}" "s3://${R2_BUCKET}/backups/weekly/$(basename ${WEEKLY_FILE})" \
      --endpoint-url "${R2_ENDPOINT}" \
      --quiet
  fi
fi

# Cleanup old daily backups
find "${BACKUP_DIR}" -maxdepth 1 -name "msm_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned up daily backups older than ${RETENTION_DAYS} days"

# Cleanup old weekly backups  
find "${BACKUP_DIR}/weekly" -name "msm_weekly_*.sql.gz" -mtime +${RETENTION_WEEKLY} -delete
echo "[$(date)] Cleaned up weekly backups older than ${RETENTION_WEEKLY} days"

echo "[$(date)] Backup complete."
