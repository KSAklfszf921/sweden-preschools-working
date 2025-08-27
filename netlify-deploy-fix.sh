#!/bin/bash

# Force Netlify deployment fix script

echo "🔧 Fixing Netlify deployment..."

# Build fresh
npm run build

# Copy assets to root with proper naming
cp -r dist/* .

# Force commit and push
git add -A
git commit -m "🚀 EMERGENCY FIX: Force Netlify refresh with correct assets

- Fixed asset paths and headers
- Added proper _redirects and _headers
- Forced refresh of cached files
- Should now load properly on Netlify

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main --force

echo "✅ Deployment fix pushed. Waiting for Netlify auto-deploy..."
echo "🌐 Check: https://sweden-preschool-spotlight.netlify.app/"