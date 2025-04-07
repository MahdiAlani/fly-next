#!/bin/bash

docker-compose exec nextjs npx ts-node scripts/fetch_initial_afs_data.js

# 2. Wait a few seconds to ensure data is inserted.
sleep 5

# 3. Run the hotel seeding script with ts-node.
docker-compose exec nextjs npx ts-node scripts/seed_hotels.js
