#!/bin/sh
set -e

echo "Running database migrations for flynext..."
npx prisma migrate deploy

echo "Starting Next.js server..."
exec npm run start
