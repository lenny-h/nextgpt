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
RUN turbo prune dashboard --docker

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

# Define build arguments
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CHAT_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PDF_EXPORTER_URL
ARG NEXT_PUBLIC_CSP_ENDPOINTS

# Set environment variables for the build
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_CHAT_URL=${NEXT_PUBLIC_CHAT_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_PDF_EXPORTER_URL=${NEXT_PUBLIC_PDF_EXPORTER_URL}
ENV NEXT_PUBLIC_CSP_ENDPOINTS=${NEXT_PUBLIC_CSP_ENDPOINTS}

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo build --filter=dashboard

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone build
COPY --from=installer --chown=nextjs:nextjs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nextjs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer --chown=nextjs:nextjs /app/apps/dashboard/public ./apps/dashboard/public

EXPOSE 3000

CMD ["node", "apps/dashboard/server.js"]