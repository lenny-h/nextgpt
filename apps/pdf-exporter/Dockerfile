FROM ghcr.io/puppeteer/puppeteer:latest AS base

# Stage 1: Prune the monorepo for this workspace
FROM base AS builder
USER root
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable pnpm
RUN npm install -g turbo

# Copy the entire monorepo
COPY . .
RUN chown -R pptruser:pptruser /app

# Generate a partial monorepo with a pruned lockfile for the pdf-exporter workspace
RUN turbo prune pdf-exporter --docker

# Stage 2: Install dependencies
FROM base AS installer
USER root
WORKDIR /app

# Install dependencies based on the pruned lockfile and package.json
COPY --from=builder /app/out/json/ .
RUN chown -R pptruser:pptruser /app
RUN npm install -g pnpm
USER pptruser
RUN pnpm install --frozen-lockfile

# Build the project
USER root
COPY --from=builder /app/out/full/ .
RUN chown -R pptruser:pptruser /app
USER pptruser
RUN pnpm turbo build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
USER root

# Copy only necessary files for production
COPY --from=installer /app .

RUN chown -R pptruser:pptruser /app
USER pptruser

EXPOSE 8080
CMD ["node", "apps/pdf-exporter/dist/src/index.js"]
