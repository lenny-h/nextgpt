FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable pnpm

FROM base AS builder
RUN npm install -g turbo
COPY . .
RUN turbo prune pdf-exporter --docker

FROM base AS installer
# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

RUN pnpm turbo build

FROM base AS runner

# Install Playwright dependencies for Chromium only (minimal footprint)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Don't run production as root
RUN addgroup --system --gid 1001 playwright \
    && adduser --system --uid 1001 playwright

# Set Playwright browsers path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Make the directory for browsers
RUN mkdir -p $PLAYWRIGHT_BROWSERS_PATH

# Copy package files and install production dependencies only
COPY --from=builder /app/out/json/ .
RUN pnpm install --prod --frozen-lockfile

# Install only Chromium browser for Playwright
# We install as root to allow --with-deps to work (if needed), though we installed deps manually above.
# We then chown the directory to the playwright user.
RUN npx playwright install chromium --with-deps \
    && chown -R playwright:playwright $PLAYWRIGHT_BROWSERS_PATH

# Copy built application
COPY --from=installer --chown=playwright:playwright /app/apps/pdf-exporter/dist ./apps/pdf-exporter/dist
COPY --from=installer --chown=playwright:playwright /app/packages ./packages

USER playwright

CMD ["node", "apps/pdf-exporter/dist/index.js"]