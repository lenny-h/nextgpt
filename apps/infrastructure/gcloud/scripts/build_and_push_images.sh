#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <project_id> <region>
PROJECT_ID=$1
REGION=$2
REPO="$REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository"

if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
  echo "Usage: bash build_and_push_images.sh <project_id> <region>"
  exit 1
fi

declare -a SERVICES=("api" "pdf-exporter" "document-processor")

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  IMAGE="$REPO/$SERVICE:latest"
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$IMAGE$"; then
    echo "Image $IMAGE does not exist locally. Building..."

    docker build -f apps/$SERVICE/Dockerfile -t $REPO/$SERVICE .
  else
    echo "Image $IMAGE already exists locally. Skipping build."
  fi

  docker push "$IMAGE"
done

echo "All images have been built and pushed successfully."
