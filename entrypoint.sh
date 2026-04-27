#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "Seeding admin account..."
# Use the compiled seed.js instead of ts-node which is not available in production
node prisma/seed.js

echo "Starting application..."

export HOSTNAME=0.0.0.0
export HOST=0.0.0.0
export PORT=3000

exec node server.js