#!/bin/bash

# Script to test the db-migrator Docker image locally
# Usage: ./test-migrator.sh [DATABASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building db-migrator Docker image...${NC}"

# Build from monorepo root
docker build -f apps/db-migrator/Dockerfile -t db-migrator:test .

echo -e "${GREEN}✓ Image built successfully${NC}"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Warning: No DATABASE_URL provided${NC}"
  echo "Usage: $0 'postgresql://postgres:password@localhost:5432/postgres'"
  exit 1
fi

DATABASE_URL=$1

echo -e "${GREEN}Running migration with provided DATABASE_URL...${NC}"
echo ""

# Run the container
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  db-migrator:test

echo ""
echo -e "${GREEN}✓ Migration completed${NC}"
