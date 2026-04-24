#!/bin/sh
set -e

# Run migrations using global Prisma binary
echo "Running prisma migrate deploy..."
prisma migrate deploy

# Seed the database using the compiled script
echo "Seeding database..."
node prisma/seed.js


# Start the application
echo "Starting application..."
node server.js