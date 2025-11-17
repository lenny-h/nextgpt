#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl]
PROJECT_ID=$1
REGION=$2
REPO="$REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository"
SKIP_FIRECRAWL=false

# Check for skip-firecrawl flag
for arg in "$@"; do
  if [ "$arg" == "--skip-firecrawl" ]; then
    SKIP_FIRECRAWL=true
  fi
done

if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
  echo "Usage: bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl]"
  exit 1
fi

declare -a SERVICES=("api" "pdf-exporter" "document-processor" "db-migrator")

if [ "$SKIP_FIRECRAWL" = false ]; then
  SERVICES+=("firecrawl-api" "playwright-service")
  echo "Including Firecrawl services in build..."
else
  echo "Skipping Firecrawl services..."
fi

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  # Define the original local image name and the cloud repository image name
  if [ "$SERVICE" == "firecrawl-api" ]; then
    LOCAL_IMAGE="firecrawl-api:latest"
    CLOUD_IMAGE="$REPO/firecrawl-api:latest"
  elif [ "$SERVICE" == "playwright-service" ]; then
    LOCAL_IMAGE="firecrawl-playwright:latest"
    CLOUD_IMAGE="$REPO/firecrawl-playwright:latest"
  else
    LOCAL_IMAGE="$SERVICE:latest"
    CLOUD_IMAGE="$REPO/$SERVICE:latest"
  fi

  # Build the image with its original name if it doesn't exist
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$LOCAL_IMAGE$"; then
    if [ "$SERVICE" == "firecrawl-api" ] || [ "$SERVICE" == "playwright-service" ]; then
      echo "Error: $LOCAL_IMAGE must exist locally. Please build it first."
      exit 1
    else
      echo "Building $SERVICE from apps/$SERVICE/Dockerfile..."
      docker build -f apps/$SERVICE/Dockerfile -t $LOCAL_IMAGE .
    fi
  else
    echo "Image $LOCAL_IMAGE already exists locally. Skipping build."
  fi

  # Tag the local image for the cloud repository
  echo "Tagging $LOCAL_IMAGE as $CLOUD_IMAGE..."
  docker tag $LOCAL_IMAGE $CLOUD_IMAGE

  # Push to cloud repository
  echo "Pushing $CLOUD_IMAGE..."
  docker push "$CLOUD_IMAGE"
done

echo "All images have been built and pushed successfully."
