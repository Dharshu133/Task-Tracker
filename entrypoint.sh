#!/bin/sh
set -e

echo "Running database migrations..."
npx --no-install prisma db push --accept-data-loss

echo "Seeding admin account..."
npx --no-install prisma db seed

echo "Starting application..."

export HOSTNAME=0.0.0.0
export HOST=0.0.0.0
export PORT=3000

exec node server.js