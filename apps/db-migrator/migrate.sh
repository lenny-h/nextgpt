#!/bin/sh
set -e

# Path to the Firecrawl-specific migration file
FIRECRAWL_MIGRATION="./src/drizzle/0000_sloppy_micromacro.sql"

# Check if USE_FIRECRAWL is set to false
if [ "$USE_FIRECRAWL" = "true" ]; then
  echo "USE_FIRECRAWL is true. Running full migrations including Firecrawl..."
else
  echo "USE_FIRECRAWL is false or not set. Creating empty version of Firecrawl migration..."
  
  # Backup the original file if it exists
  if [ -f "$FIRECRAWL_MIGRATION" ]; then
    cp "$FIRECRAWL_MIGRATION" "${FIRECRAWL_MIGRATION}.backup"
    
    # Create an empty file (but keep the file structure for drizzle-kit)
    echo "-- Firecrawl migration disabled (USE_FIRECRAWL=false)" > "$FIRECRAWL_MIGRATION"
    echo "-- Original migration backed up to ${FIRECRAWL_MIGRATION}.backup" >> "$FIRECRAWL_MIGRATION"
  fi
fi

# Run the migrations
echo "Running drizzle-kit migrate..."
pnpm exec drizzle-kit migrate

echo "Migration completed successfully!"
