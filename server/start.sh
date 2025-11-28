#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "Running database migrations..."
pnpm run migrate

# Start the server
echo "Waiting for database to be ready..."
sleep 10
echo "Starting the server..."
exec node dist/index.js
