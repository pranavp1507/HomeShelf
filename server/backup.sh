#!/bin/sh
set -e

BACKUP_DIR="/backups"
DB_NAME="library"
DB_USER="user"
DB_HOST="postgres" # Service name in docker-compose
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql"

echo "Starting PostgreSQL backup for database $DB_NAME to $BACKUP_FILE..."

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform the backup
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

echo "Backup completed successfully to $BACKUP_FILE"

# Optional: Remove old backups (e.g., keep last 7 days)
# find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete
# echo "Old backups removed."
