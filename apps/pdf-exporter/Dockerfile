FROM ghcr.io:puppeteer/puppeteer:latest AS base

FROM base AS builder
# Enable pnpm via corepack
RUN corepack enable pnpm
# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune pdf-exporter --docker

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
RUN corepack enable pnpm
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 puppeteer
RUN adduser --system --uid 1001 puppeteer
USER puppeteer

# Copy package files and install production dependencies only
COPY --from=builder /app/out/json/ .
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=installer --chown=puppeteer:puppeteer /app/apps/pdf-exporter/dist ./apps/pdf-exporter/dist
COPY --from=installer --chown=puppeteer:puppeteer /app/packages ./packages

EXPOSE 8080
CMD ["node", "apps/pdf-exporter/dist/src/index.js"]
