#!/usr/bin/env bash
set -e

echo "=== PTBot Codespaces Setup ==="

# Install dependencies with legacy peer deps (required by this project)
npm install --legacy-peer-deps

# Supabase CLI is included as a dev dependency, verify it works
echo "Supabase CLI version: $(npx supabase --version)"

# Check if Codespaces secrets are configured
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo ""
  echo "================================================"
  echo "  NOTE: Codespaces secrets not detected."
  echo ""
  echo "  To configure, go to your GitHub repo:"
  echo "    Settings > Secrets > Codespaces"
  echo ""
  echo "  Add these secrets:"
  echo "    - EXPO_PUBLIC_SUPABASE_URL"
  echo "    - EXPO_PUBLIC_SUPABASE_ANON_KEY"
  echo "    - VITE_SUPABASE_URL"
  echo "    - VITE_SUPABASE_ANON_KEY"
  echo ""
  echo "  Then rebuild your Codespace."
  echo "================================================"
  echo ""
else
  echo "Codespaces secrets detected - you're all set!"
fi

echo ""
echo "=== Setup complete! Run 'npm run dev' to start ==="
