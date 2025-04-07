# fly-next/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Copy the centralized .env file from the repo root
COPY .env .env
# Copy package files from fly-next folder
COPY fly-next/package.json fly-next/package-lock.json ./
RUN npm install

# Copy the prisma folder
COPY fly-next/prisma ./prisma

# Generate the Prisma client
RUN npx prisma generate

# Explicitly copy the scripts folder
COPY fly-next/scripts ./scripts

# Copy the rest of the fly-next project files
COPY fly-next/ ./

# Build the Next.js app for production
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /fly-next
ENV NODE_ENV=production

# Copy package.json for npm run start
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# Copy the scripts folder from the builder stage
COPY --from=builder /app/scripts ./scripts
COPY fly-next/entrypoint.sh ./entrypoint.sh

RUN if [ -d "fly-next" ]; then mv fly-next/* . && rm -rf fly-next; fi

RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["/fly-next/entrypoint.sh"]
