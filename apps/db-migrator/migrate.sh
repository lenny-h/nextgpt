#!/bin/sh
set -e

# Check if EMBEDDING_DIMENSIONS is provided
if [ -z "$EMBEDDING_DIMENSIONS" ]; then
  echo "Error: EMBEDDING_DIMENSIONS environment variable is required but not set."
  echo "Please set EMBEDDING_DIMENSIONS to a valid value (e.g., 256, 512, or 1024 for AWS)."
  exit 1
fi

echo "Using embedding dimensions: $EMBEDDING_DIMENSIONS"

# Path to the Firecrawl-specific migration file
FIRECRAWL_MIGRATION="./src/drizzle/0000_sloppy_micromacro.sql"

# Path to the migration file that contains vector embeddings
EMBEDDING_MIGRATION="./src/drizzle/0001_tearful_firedrake.sql"

# Configure embedding dimensions if the migration file exists
if [ -f "$EMBEDDING_MIGRATION" ]; then
  echo "Configuring embedding dimensions in migration file..."
  
  # Replace vector(768) with the configured dimension
  # This handles the SQL migration file format: "embedding" vector(768) NOT NULL,
  sed -i.tmp "s/vector([0-9]\+)/vector($EMBEDDING_DIMENSIONS)/g" "$EMBEDDING_MIGRATION"
  rm -f "${EMBEDDING_MIGRATION}.tmp"
  
  echo "Embedding dimensions configured successfully."
fi

# Check if USE_FIRECRAWL is set to false
if [ "$USE_FIRECRAWL" = "true" ]; then
  echo "USE_FIRECRAWL is true. Running full migrations including Firecrawl..."
else
  echo "USE_FIRECRAWL is false or not set. Creating empty version of Firecrawl migration..."
  
  # Backup the original file if it exists
  if [ -f "$FIRECRAWL_MIGRATION" ]; then
    # Create an empty file (but keep the file structure for drizzle-kit)
    echo "-- Firecrawl migration disabled (USE_FIRECRAWL=false)" > "$FIRECRAWL_MIGRATION"
  fi
fi

# Run the migrations
echo "Running drizzle-kit migrate..."
pnpm exec drizzle-kit migrate

echo "Migration completed successfully!"
