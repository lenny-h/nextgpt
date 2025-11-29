#!/bin/bash
set -e

# Usage: bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl] [--service <service_name>]
AWS_ACCOUNT_ID=$1
REGION=$2
PROJECT_NAME=$3
SKIP_FIRECRAWL=false
declare -a FILTER_SERVICES=()

# Parse arguments
shift 3 # Skip AWS_ACCOUNT_ID, REGION, and PROJECT_NAME
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

if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$REGION" ] || [ -z "$PROJECT_NAME" ]; then
  echo "Usage: bash build_and_push_images.sh <aws_account_id> <region> <project_name> [--skip-firecrawl] [--service <service_name>]"
  exit 1
fi

REPO="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME"

# Login to ECR
echo "Logging into AWS ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO

declare -a SERVICES=()

if [ ${#FILTER_SERVICES[@]} -gt 0 ]; then
  SERVICES=("${FILTER_SERVICES[@]}")
  echo "Building specific services: ${SERVICES[*]}"
else
  SERVICES=("api" "pdf-exporter" "document-processor" "db-migrator")
  if [ "$SKIP_FIRECRAWL" = false ]; then
    SERVICES+=("firecrawl-api" "firecrawl-playwright")
    echo "Including Firecrawl services in build..."
  else
    echo "Skipping Firecrawl services..."
  fi
fi

for SERVICE in "${SERVICES[@]}"; do
  echo "Building and pushing $SERVICE..."

  # Define the ECR image name
  ECR_IMAGE="$REPO/$SERVICE:latest"

  # Build the image with its original name if it doesn't exist
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$ECR_IMAGE$"; then
    if [ "$SERVICE" == "firecrawl-api" ] || [ "$SERVICE" == "firecrawl-playwright" ]; then
      echo "Error: $ECR_IMAGE must exist locally. Please build it first."
      exit 1
    else
      echo "Building $SERVICE from apps/$SERVICE/Dockerfile..."
      docker buildx build --platform linux/arm64 -f apps/$SERVICE/Dockerfile -t $ECR_IMAGE .
    fi
  else
    echo "Image $ECR_IMAGE already exists locally. Skipping build."
  fi

  # Push to ECR
  echo "Pushing $ECR_IMAGE..."
  docker push "$ECR_IMAGE"
done

echo "All images have been built and pushed successfully."
