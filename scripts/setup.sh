#!/bin/bash
# Worktree setup script for Conductor
# Ensures worktrees are based on the latest master before installing dependencies

set -e

echo "Fetching latest from origin..."
git fetch origin

# Copy .env.local from main repo if it exists
MAIN_REPO=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/.git$||')
if [ -f "$MAIN_REPO/.env.local" ]; then
    echo "Copying .env.local from main repo..."
    cp "$MAIN_REPO/.env.local" .env.local
else
    echo "No .env.local found in main repo, skipping..."
fi

echo "Installing dependencies..."
pnpm install

echo "Building project..."
pnpm build

echo "Setup complete!"
