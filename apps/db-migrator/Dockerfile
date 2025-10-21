# Minimal image to run drizzle-kit migrations
FROM node:22-alpine

WORKDIR /app

# Install only the required dependencies for drizzle-kit migrate
RUN npm install -g drizzle-orm@0.44.5 drizzle-kit@0.31.5 pg@8.16.3 dotenv@17.2.2

# Copy the drizzle config and schema
COPY packages/server/drizzle.config.ts ./
COPY packages/server/src/drizzle ./src/drizzle

# Run migrations
CMD ["npx", "drizzle-kit", "migrate"]

