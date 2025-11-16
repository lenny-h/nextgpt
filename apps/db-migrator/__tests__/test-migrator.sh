#!/bin/bash

# Script to test the db-migrator Docker image locally
# Usage: ./test-migrator.sh DATABASE_PASSWORD DATABASE_HOST

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

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${YELLOW}Warning: DATABASE_PASSWORD and DATABASE_HOST must be provided${NC}"
  echo "Usage: $0 <DATABASE_PASSWORD> <DATABASE_HOST>"
  echo "Example: $0 'password' 'host.docker.internal:5432'"
  exit 1
fi

DATABASE_PASSWORD=$1
DATABASE_HOST=$2

echo -e "${GREEN}Running migration with provided DATABASE_PASSWORD and DATABASE_HOST...${NC}"
echo ""

# Run the container
docker run --rm \
  -e DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  -e DATABASE_HOST="$DATABASE_HOST" \
  db-migrator:test

echo ""
echo -e "${GREEN}✓ Migration completed${NC}"
