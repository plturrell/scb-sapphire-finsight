#!/bin/bash

# This script synchronizes API files between the main codebase and the development environment
# Usage: ./.scripts/sync-api-files.sh [--from-dev] [--dry-run]

FROM_DEV=false
DRY_RUN=false

for arg in "$@"; do
  if [ "$arg" == "--from-dev" ]; then
    FROM_DEV=true
  fi
  if [ "$arg" == "--dry-run" ]; then
    DRY_RUN=true
  fi
done

# Define the source and destination based on direction
if [ "$FROM_DEV" = true ]; then
  SRC_DIR="./finsight-app/src"
  DEST_DIR="./src"
  DIRECTION_MSG="from development to production"
else
  SRC_DIR="./src"
  DEST_DIR="./finsight-app/src"
  DIRECTION_MSG="from production to development"
fi

echo "Synchronizing API files $DIRECTION_MSG"

# Function to sync a file
sync_file() {
  local src_file=$1
  local dest_file=$2
  
  if [ ! -f "$src_file" ]; then
    echo "Warning: Source file $src_file does not exist, skipping"
    return
  fi
  
  # Create destination directory if it doesn't exist
  local dest_dir=$(dirname "$dest_file")
  if [ ! -d "$dest_dir" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo "Would create directory: $dest_dir"
    else
      mkdir -p "$dest_dir"
      echo "Created directory: $dest_dir"
    fi
  fi
  
  if [ "$DRY_RUN" = true ]; then
    echo "Would copy: $src_file -> $dest_file"
  else
    cp "$src_file" "$dest_file"
    echo "Copied: $src_file -> $dest_file"
  fi
}

# Sync Perplexity API files
sync_file "$SRC_DIR/pages/api/perplexity-proxy.ts" "$DEST_DIR/pages/api/perplexity-proxy.ts"

# Add any other API files you want to always keep in sync here
# For example:
# sync_file "$SRC_DIR/pages/api/market-news.ts" "$DEST_DIR/pages/api/market-news.ts"
# sync_file "$SRC_DIR/pages/api/tariff-search.ts" "$DEST_DIR/pages/api/tariff-search.ts"

echo "Synchronization complete!"
