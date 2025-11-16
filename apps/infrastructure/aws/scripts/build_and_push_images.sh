#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl]
AWS_ACCOUNT_ID=$1
REGION=$2
PROJECT_NAME=$3
SKIP_FIRECRAWL=false

# Check for skip-firecrawl flag
for arg in "$@"; do
  if [ "$arg" == "--skip-firecrawl" ]; then
    SKIP_FIRECRAWL=true
  fi
done

if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$REGION" ] || [ -z "$PROJECT_NAME" ]; then
  echo "Usage: bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl]"
  exit 1
fi

REPO="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME"

# Login to ECR
echo "Logging into AWS ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO

declare -a SERVICES=("api" "pdf-exporter" "document-processor" "db-migrator")

if [ "$SKIP_FIRECRAWL" = false ]; then
  SERVICES+=("firecrawl-postgres" "firecrawl-api" "playwright-service")
  echo "Including Firecrawl services in build..."
else
  echo "Skipping Firecrawl services..."
fi

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  # Define the original local image name and the ECR image name
  if [ "$SERVICE" == "firecrawl-api" ]; then
    LOCAL_IMAGE="firecrawl:latest"
    ECR_IMAGE="$REPO-firecrawl-api:latest"
  elif [ "$SERVICE" == "playwright-service" ]; then
    LOCAL_IMAGE="firecrawl-playwright:latest"
    ECR_IMAGE="$REPO-playwright-service:latest"
  else
    LOCAL_IMAGE="$SERVICE:latest"
    ECR_IMAGE="$REPO-$SERVICE:latest"
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

  # Tag the local image for ECR
  echo "Tagging $LOCAL_IMAGE as $ECR_IMAGE..."
  docker tag $LOCAL_IMAGE $ECR_IMAGE

  # Push to ECR
  echo "Pushing $ECR_IMAGE..."
  docker push "$ECR_IMAGE"
done

echo "All images have been built and pushed successfully."
