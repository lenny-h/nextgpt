#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl] [--service <service_name>]
PROJECT_ID=$1
REGION=$2
REPO="$REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository"
SKIP_FIRECRAWL=false
declare -a FILTER_SERVICES=()

# Parse arguments
shift 2 # Skip PROJECT_ID and REGION
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-firecrawl)
      SKIP_FIRECRAWL=true
      shift
      ;;
    --service)
      FILTER_SERVICES+=("$2")
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
  echo "Usage: bash build_and_push_images.sh <project_id> <region> [--skip-firecrawl] [--service <service_name>]"
  exit 1
fi

declare -a SERVICES=()

if [ ${#FILTER_SERVICES[@]} -gt 0 ]; then
  SERVICES=("${FILTER_SERVICES[@]}")
  echo "Building specific services: ${SERVICES[*]}"
else
  SERVICES=("api" "pdf-exporter" "document-processor" "db-migrator")
  if [ "$SKIP_FIRECRAWL" = false ]; then
    SERVICES+=("firecrawl-api" "playwright-service")
    echo "Including Firecrawl services in build..."
  else
    echo "Skipping Firecrawl services..."
  fi
fi

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  # Define the original local image name and the cloud repository image name
  if [ "$SERVICE" == "firecrawl-api" ]; then
    CLOUD_IMAGE="$REPO/firecrawl-api:latest"
  elif [ "$SERVICE" == "playwright-service" ]; then
    CLOUD_IMAGE="$REPO/firecrawl-playwright:latest"
  else
    CLOUD_IMAGE="$REPO/$SERVICE:latest"
  fi

  # Build the image with its original name if it doesn't exist
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$CLOUD_IMAGE$"; then
    if [ "$SERVICE" == "firecrawl-api" ] || [ "$SERVICE" == "playwright-service" ]; then
      echo "Error: $CLOUD_IMAGE must exist locally. Please build it first."
      exit 1
    else
      echo "Building $SERVICE from apps/$SERVICE/Dockerfile..."
      docker buildx build --platform linux/amd64 -f apps/$SERVICE/Dockerfile -t $CLOUD_IMAGE .
    fi
  else
    echo "Image $CLOUD_IMAGE already exists locally. Skipping build."
  fi

  # Push to cloud repository
  echo "Pushing $CLOUD_IMAGE..."
  docker push "$CLOUD_IMAGE"
done

echo "All images have been built and pushed successfully."
