FROM node:lts-alpine

# Install pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copy package.json and install dependencies
COPY apps/db-migrator/package.json ./apps/db-migrator/
WORKDIR /app/apps/db-migrator
RUN pnpm install

# Copy migration configuration and source files
COPY packages/server/drizzle.config.ts ./drizzle.config.ts
COPY packages/server/src/drizzle ./src/drizzle

# Copy the migration wrapper script
COPY apps/db-migrator/migrate.sh ./migrate.sh
RUN chmod +x ./migrate.sh

# Run migrations using the wrapper script
CMD ["./migrate.sh"]
