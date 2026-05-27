#!/bin/bash
# Syncs SDK reference .md files from the UiPath TypeScript SDK repo
# into our template's prompts/sdk-reference/ directory.
#
# Usage: ./sync-sdk-references.sh
#
# Source: github.com/UiPath/uipath-typescript (feat/codedapps-skill branch)
# Files synced: orchestrator.md, data-fabric.md, action-center.md, maestro.md, pagination.md, patterns.md

set -euo pipefail

REPO="UiPath/uipath-typescript"
BRANCH="feat/codedapps-skill"
BASE_PATH="agent-skills/.claude-plugin/plugins/uipath-coded-apps/skills/create-app/references"
TARGET_DIR="$(cd "$(dirname "$0")" && pwd)/prompts/sdk-reference"

FILES=(
  "orchestrator.md"
  "data-fabric.md"
  "action-center.md"
  "maestro.md"
  "pagination.md"
  "patterns.md"
  "conversational-agent.md"
)

mkdir -p "$TARGET_DIR"

echo "Syncing SDK reference files from $REPO ($BRANCH)..."

MAX_RETRIES=3
TIMEOUT=30

for file in "${FILES[@]}"; do
  url="https://raw.githubusercontent.com/${REPO}/${BRANCH}/${BASE_PATH}/${file}"
  echo "  Downloading $file..."
  echo "    URL: $url"

  success=false
  for attempt in $(seq 1 $MAX_RETRIES); do
    http_code=$(curl -sL --max-time "$TIMEOUT" -w "%{http_code}" "$url" -o "$TARGET_DIR/$file" 2>/dev/null) || true

    if [ "$http_code" -ge 200 ] 2>/dev/null && [ "$http_code" -lt 300 ] 2>/dev/null; then
      echo "    OK (HTTP $http_code)"
      success=true
      break
    fi

    if [ "$attempt" -lt "$MAX_RETRIES" ]; then
      echo "    Attempt $attempt failed (HTTP $http_code), retrying in 2s..." >&2
      sleep 2
    fi
  done

  if [ "$success" = false ]; then
    echo "    FAILED to download $file after $MAX_RETRIES attempts (last HTTP $http_code)" >&2
    echo "    Check that the file exists at: $url" >&2
    rm -f "$TARGET_DIR/$file"
    exit 1
  fi
done

echo "Done. Files synced to $TARGET_DIR"
