#!/usr/bin/env bash
set -e

echo "=== PTBot Codespaces Setup ==="

# Install dependencies with legacy peer deps (required by this project)
npm install --legacy-peer-deps

# Copy .env.example if no .env exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "================================================"
  echo "  .env file created from .env.example"
  echo "  Update it with your actual API keys:"
  echo "    - EXPO_PUBLIC_SUPABASE_URL"
  echo "    - EXPO_PUBLIC_SUPABASE_ANON_KEY"
  echo "    - VITE_SUPABASE_URL"
  echo "    - VITE_SUPABASE_ANON_KEY"
  echo "================================================"
  echo ""
fi

echo "=== Setup complete! Run 'npm run dev' to start ==="
