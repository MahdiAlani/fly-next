#!/bin/bash

echo "Setting up project..."

# Move into fly-next project
cd fly-next

# Install dependencies
echo "Installing dependencies..."
npm install

# Install jsPDF
echo "Installing jsPDF..."
npm install jspdf

# Generate prisma
echo "Generating Prisma..."
npx prisma generate

# Apply migrations
echo "Applying database migrations..."
npx prisma migrate dev

# Fetch cities and airports from AFS API
echo "Fetching cities and airports from AFS API..."
node scripts/fetch_initial_afs_data.js

echo "Setup complete!"