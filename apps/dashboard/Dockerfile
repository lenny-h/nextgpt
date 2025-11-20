FROM node:lts-alpine AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

FROM base AS prepare
RUN corepack enable pnpm
RUN npm install -g turbo
COPY . .
# Add lockfile and package.json's of isolated subworkspace
RUN turbo prune dashboard --docker

FROM base AS builder
RUN corepack enable pnpm
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile
# Build the project
COPY --from=prepare /app/out/full/ .

# Define build arguments
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CHAT_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PDF_EXPORTER_URL

ARG NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP
ARG NEXT_PUBLIC_ENABLE_OAUTH_LOGIN
ARG NEXT_PUBLIC_ENABLE_SSO
ARG NEXT_PUBLIC_USE_FIRECRAWL

ARG NEXT_PUBLIC_CSP_ENDPOINTS

# Set environment variables for the build
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_CHAT_URL=${NEXT_PUBLIC_CHAT_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_PDF_EXPORTER_URL=${NEXT_PUBLIC_PDF_EXPORTER_URL}

ENV NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP=${NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP}
ENV NEXT_PUBLIC_ENABLE_OAUTH_LOGIN=${NEXT_PUBLIC_ENABLE_OAUTH_LOGIN}
ENV NEXT_PUBLIC_ENABLE_SSO=${NEXT_PUBLIC_ENABLE_SSO}
ENV NEXT_PUBLIC_USE_FIRECRAWL=${NEXT_PUBLIC_USE_FIRECRAWL}

ENV NEXT_PUBLIC_CSP_ENDPOINTS=${NEXT_PUBLIC_CSP_ENDPOINTS}

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo build

FROM base AS runner
# Don't run production as root for security reasons
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

CMD ["node", "apps/dashboard/server.js"]