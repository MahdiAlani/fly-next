#!/bin/sh
set -e

echo "Waiting for database at db:5432..."
# Wait until the database is ready (using netcat)
while ! nc -z db 5432; do
  sleep 1
done

echo "Database is up. Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting AFS server..."
exec npm run dev
