FROM node:lts-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Enable pnpm via corepack
RUN corepack enable pnpm
# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune db-migrator --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

RUN pnpm turbo build

FROM base AS runner
WORKDIR /app
RUN corepack enable pnpm

# Don't run production as root
RUN addgroup --system --gid 1001 migrator
RUN adduser --system --uid 1001 migrator

# Copy package files and install production dependencies only
COPY --from=builder /app/out/json/ .
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=installer --chown=migrator:migrator /app/apps/db-migrator/dist ./apps/db-migrator/dist
COPY --from=installer --chown=migrator:migrator /app/packages ./packages

USER migrator

CMD ["npx", "drizzle-kit", "migrate"]
