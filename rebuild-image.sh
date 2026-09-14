#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAG="immich-public-proxy-gps:local"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not available in PATH" >&2
  exit 1
fi

cd "$SCRIPT_DIR"

echo "Building $IMAGE_TAG from $SCRIPT_DIR"
docker build -t "$IMAGE_TAG" .