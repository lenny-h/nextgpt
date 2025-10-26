FROM node:lts-alpine AS base

FROM base AS builder
# Enable pnpm via corepack
RUN corepack enable pnpm
# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune db-migrator --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
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

# Don't run production as root
RUN addgroup --system --gid 1001 migrator
RUN adduser --system --uid 1001 migrator
USER migrator
COPY --from=installer /app .

CMD ["npx", "drizzle-kit", "migrate"]