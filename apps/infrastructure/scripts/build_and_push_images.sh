#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <region> <project_id>
REGION=$1
PROJECT_ID=$2
REPO="$REGION-docker.pkg.dev/$PROJECT_ID/app-artifact-repository"

if [ -z "$REGION" ] || [ -z "$PROJECT_ID" ]; then
  echo "Usage: bash build_and_push_images.sh <region> <project_id>"
  exit 1
fi

declare -a SERVICES=("api" "pdf-exporter" "pdf-processor" "analytics" "auth" "kong" "meta" "rest" "studio")

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  IMAGE="$REPO/$SERVICE:latest"
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$IMAGE$"; then
    echo "Image $IMAGE does not exist locally. Building..."

    if [[ "$SERVICE" == "api" || "$SERVICE" == "pdf-exporter" || "$SERVICE" == "pdf-processor" ]]; then
      docker build -f apps/$SERVICE/Dockerfile -t $REPO/$SERVICE .
    else
      docker build -f apps/supabase/images/$SERVICE.Dockerfile -t $REPO/$SERVICE .
    fi
  else
    echo "Image $IMAGE already exists locally. Skipping build."
  fi

  docker push "$IMAGE"
done

echo "All images have been built and pushed successfully."
